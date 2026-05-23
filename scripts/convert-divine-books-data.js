import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const sourcePath = "projetos-base-inicial/gerenciador-de-livros-divinos/data.js";
const outputPath = "src/features/divine-books/data/divine-books.json";
const publicAssetPrefix = "assets/divine-books";

const aliasesByName = {
  "Espinho de Rosa": "Espinhos de Rosa",
  "Fonte do deserto": "Fonte do Deserto",
  "Risada de Loucura": "Risada da Loucura",
  "Frangância dos Céus": "Fragrância dos Céus"
};

const sourceCode = `${fs.readFileSync(sourcePath, "utf8")}\nthis.DATA = DATA;`;
const context = {};
vm.runInNewContext(sourceCode, context, { filename: sourcePath });

const sourceTabs = context.DATA.filter((tab) => Array.isArray(tab.items) && tab.items.length > 0);
const itemByName = new Map();
const items = [];
const recipes = [];
const materialImages = new Map();
const recipeCountByItem = new Map();

const tabs = sourceTabs.map((tab, index) => ({
  id: `divine-books-tab-${index + 1}`,
  label: tab.titulo,
  sortOrder: index + 1
}));

for (const [tabIndex, tab] of sourceTabs.entries()) {
  const tabId = tabs[tabIndex].id;

  for (const sourceItem of tab.items) {
    const canonicalName = canonicalizeName(sourceItem.nome);
    const itemId = toItemId("divine-book", canonicalName);

    if (!itemByName.has(canonicalName)) {
      const item = {
        id: itemId,
        type: "divine-book",
        name: canonicalName,
        level: Number(sourceItem.nivel) || null,
        icon: toAssetPath(sourceItem.imagem),
        effects: sourceItem.efeitos ?? [],
        tabs: [tabId]
      };

      itemByName.set(canonicalName, item);
      items.push(item);
    } else {
      const existingItem = itemByName.get(canonicalName);

      if (!existingItem.tabs.includes(tabId)) {
        existingItem.tabs.push(tabId);
      }
    }

    for (const material of sourceItem.materiais ?? []) {
      materialImages.set(canonicalizeName(material.nome), toAssetPath(material.imagem));
    }

    const nextRecipeCount = (recipeCountByItem.get(itemId) ?? 0) + 1;
    recipeCountByItem.set(itemId, nextRecipeCount);

    recipes.push({
      id: `recipe-${tabId}-${slugify(canonicalName)}-${nextRecipeCount}`,
      resultItemId: itemId,
      resultQuantity: 1,
      sourceTabId: tabId,
      materials: (sourceItem.materiais ?? []).map((material) => ({
        itemId: toItemIdForName(material.nome),
        quantity: Number(material.quantidade) || 1
      }))
    });
  }
}

const knownItemIds = new Set(items.map((item) => item.id));
const baseMaterials = [...materialImages.entries()]
  .filter(([name]) => !knownItemIds.has(toItemId("divine-book", name)))
  .map(([name, icon]) => ({
    id: toItemId("material", name),
    type: "material",
    name,
    level: null,
    icon,
    effects: [],
    tabs: []
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const aliases = Object.fromEntries(
  Object.entries(aliasesByName).map(([alias, canonical]) => [alias, toItemId("divine-book", canonical)])
);

const output = {
  schemaVersion: 1,
  feature: "divine-books",
  tabs,
  items: [...items, ...baseMaterials],
  recipes,
  aliases
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

function canonicalizeName(name) {
  return aliasesByName[name] ?? name;
}

function toItemIdForName(name) {
  const canonicalName = canonicalizeName(name);
  const bookId = toItemId("divine-book", canonicalName);

  return itemByName.has(canonicalName) ? bookId : toItemId("material", canonicalName);
}

function toItemId(prefix, name) {
  return `${prefix}-${slugify(name)}`;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toAssetPath(value = "") {
  const fileName = value.replace(/^images\//, "");

  return fileName ? `${publicAssetPrefix}/${fileName}` : "";
}
