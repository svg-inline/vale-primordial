import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

await loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

const divineBooks = JSON.parse(
  await readFile(new URL("../src/lib/data/divine-books.json", import.meta.url), "utf8"),
);

await seedDivineBooks();

async function seedDivineBooks() {
  const tabs = divineBooks.tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    sort_order: tab.sortOrder ?? 0,
  }));

  await assertOk(
    supabase.from("divine_book_tabs").upsert(tabs, { onConflict: "id" }),
    "upsert divine_book_tabs",
  );

  const items = divineBooks.items.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    level: item.level ?? null,
    icon: item.icon ?? null,
    description: item.description ?? "",
    effects: item.effects ?? [],
    tabs: item.tabs ?? [],
  }));

  await assertOk(
    supabase.from("items").upsert(items, { onConflict: "id" }),
    "upsert items",
  );

  const resultItemIds = divineBooks.recipes.map((recipe) => recipe.resultItemId);

  if (resultItemIds.length > 0) {
    await assertOk(
      supabase.from("recipes").delete().in("result_item_id", resultItemIds),
      "clear old divine book recipes",
    );
  }

  let recipeCount = 0;
  let materialCount = 0;

  for (const [recipeIndex, recipe] of divineBooks.recipes.entries()) {
    const { data: recipeRow, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        result_item_id: recipe.resultItemId,
        sort_order: recipe.sortOrder ?? recipeIndex,
      })
      .select("id")
      .single();

    if (recipeError) {
      throw new Error(`insert recipe ${recipe.id}: ${recipeError.message}`);
    }

    recipeCount += 1;

    const materials = (recipe.materials ?? []).map((material, materialIndex) => ({
      recipe_id: recipeRow.id,
      item_id: material.itemId,
      quantity: material.quantity,
      sort_order: materialIndex,
    }));

    if (materials.length > 0) {
      await assertOk(
        supabase.from("recipe_materials").insert(materials),
        `insert materials for ${recipe.id}`,
      );
      materialCount += materials.length;
    }
  }

  console.log(
    `Seed complete: ${tabs.length} tabs, ${items.length} items, ${recipeCount} recipes, ${materialCount} recipe materials.`,
  );
}

async function assertOk(query, label) {
  const { error } = await query;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
}

async function loadDotEnv() {
  try {
    const envPath = new URL("../.env", import.meta.url);
    const envContent = await readFile(envPath, "utf8");

    for (const line of envContent.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      const value = rawValue.replace(/^["']|["']$/g, "");

      process.env[key] ??= value;
    }
  } catch {
    // The script also supports regular shell environment variables.
  }
}
