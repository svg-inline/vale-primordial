import { getDivineBookCatalog } from "@/lib/data/catalogs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DivineBookCatalog, DivineBooksItem } from "@/types/divine-books";

interface RecipeRow {
  id: string;
  result_item_id: string;
  sort_order: number;
  recipe_materials:
    | Array<{
        item_id: string;
        quantity: number;
        sort_order: number;
      }>
    | null;
}

export async function getDivineBookCatalogServer(): Promise<DivineBookCatalog> {
  const fallback = getDivineBookCatalog();
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return fallback;
  }

  try {
    const [tabsResult, itemsResult, recipesResult] = await Promise.all([
      supabase
        .from("divine_book_tabs")
        .select("id,label,sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("items")
        .select("id,type,name,level,icon,description,effects,tabs")
        .order("level", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true }),
      supabase
        .from("recipes")
        .select("id,result_item_id,sort_order,recipe_materials(item_id,quantity,sort_order)")
        .order("sort_order", { ascending: true }),
    ]);

    if (tabsResult.error || itemsResult.error || recipesResult.error) {
      return fallback;
    }

    const tabs = (tabsResult.data ?? []).map((tab) => ({
      id: tab.id,
      label: tab.label,
      sortOrder: tab.sort_order,
    }));

    const items = (itemsResult.data ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      level: item.level,
      icon: item.icon ?? "",
      description: item.description ?? "",
      effects: item.effects ?? [],
      tabs: item.tabs ?? [],
    })) as DivineBooksItem[];

    if (tabs.length === 0 || items.length === 0) {
      return fallback;
    }

    const itemsById = new Map(items.map((item) => [item.id, item]));
    const recipes = ((recipesResult.data ?? []) as RecipeRow[]).map((recipe) => {
      const resultItem = itemsById.get(recipe.result_item_id);

      return {
        id: recipe.id,
        resultItemId: recipe.result_item_id,
        sourceTabId: resultItem?.tabs[0] ?? tabs[0]?.id ?? "",
        sortOrder: recipe.sort_order,
        materials: [...(recipe.recipe_materials ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((material) => ({
            itemId: material.item_id,
            quantity: material.quantity,
          })),
      };
    });

    return {
      ...fallback,
      tabs,
      items,
      recipes,
    };
  } catch {
    return fallback;
  }
}
