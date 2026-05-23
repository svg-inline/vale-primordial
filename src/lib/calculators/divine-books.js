export const defaultFilters = {
  tabId: "all",
  query: "",
  stat: "",
  ownedMode: "all"
};

export function createDivineBooksService(data) {
  const books = data.items.filter((item) => item.type === "divine-book");
  const materials = data.items.filter((item) => item.type === "material");
  const itemsById = new Map(data.items.map((item) => [item.id, item]));
  const recipesByResultId = groupBy(data.recipes, "resultItemId");
  const aliasesByNormalizedName = new Map(
    Object.entries(data.aliases ?? {}).map(([name, itemId]) => [normalizeText(name), itemId])
  );
  const itemIdsByNormalizedName = new Map(
    data.items.map((item) => [normalizeText(item.name), item.id])
  );

  function getInitialState() {
    return {
      tabs: data.tabs,
      books,
      materials,
      aliases: data.aliases ?? {},
      stats: {
        totalBooks: books.length,
        totalRecipes: data.recipes.length,
        totalMaterials: materials.length
      },
      filters: defaultFilters,
      warnings: validateData()
    };
  }

  function filterBooks({ filters = {}, owned = {}, recipePreferences = {} } = {}) {
    const nextFilters = { ...defaultFilters, ...filters };
    const query = normalizeText(nextFilters.query);
    const stat = normalizeText(nextFilters.stat);
    const result = books.filter((book) => {
      const recipe = getRecipeForItem(book.id, {});
      const materialNames = (recipe?.materials ?? [])
        .map((material) => itemsById.get(material.itemId)?.name ?? "")
        .join(" ");
      const searchable = normalizeText(`${book.name} ${book.effects.join(" ")} ${materialNames}`);
      const isOwned = getOwnedQuantity(owned, book.id) > 0;

      return (
        (nextFilters.tabId === "all" || book.tabs.includes(nextFilters.tabId)) &&
        (!query || searchable.includes(query)) &&
        (!stat || normalizeText(book.effects.join(" ")).includes(stat)) &&
        (nextFilters.ownedMode === "all" ||
          (nextFilters.ownedMode === "owned" && isOwned) ||
          (nextFilters.ownedMode === "missing" && !isOwned))
      );
    });

    return {
      filters: nextFilters,
      books: result.map((book) => toBookSummary(book, owned, recipePreferences)),
      stats: {
        totalBooks: books.length,
        ownedBooks: countOwnedBooks(owned, books),
        visibleBooks: result.length
      }
    };
  }

  function getItem({ itemId, owned = {}, recipePreferences = {} } = {}) {
    const resolvedItemId = resolveItemId(itemId);
    const item = itemsById.get(resolvedItemId);

    if (!item) {
      return { item: null, recipes: [], warnings: ["ITEM_NOT_FOUND"] };
    }

    const recipes = getRecipesForItem(resolvedItemId);

    return {
      item,
      recipes,
      selectedRecipeId: getRecipeForItem(resolvedItemId, recipePreferences)?.id ?? "",
      ownedQuantity: getOwnedQuantity(owned, resolvedItemId),
      warnings: recipes.length ? [] : item.type === "material" ? [] : ["RECIPE_NOT_FOUND"]
    };
  }

  function calculateBaseMaterials({
    itemId,
    owned = {},
    treeProgress = {},
    recipePreferences = {}
  } = {}) {
    const resolvedItemId = resolveItemId(itemId);

    if (!itemsById.has(resolvedItemId)) {
      return emptyCalculation(["ITEM_NOT_FOUND"]);
    }

    const pool = createOwnedPool(owned);
    const required = new Map();
    const remaining = new Map();

    collectBaseMaterials({
      itemId: resolvedItemId,
      quantity: 1,
      path: resolvedItemId,
      treeProgress: {},
      recipePreferences,
      pool: {},
      required,
      respectOwned: false
    });
    collectBaseMaterials({
      itemId: resolvedItemId,
      quantity: 1,
      path: resolvedItemId,
      treeProgress,
      recipePreferences,
      pool,
      required: remaining,
      respectOwned: true
    });

    const totalRequiredUnits = sumMapValues(required);
    const totalRemainingUnits = sumMapValues(remaining);

    return {
      required: materialEntries(required),
      missing: materialEntries(remaining),
      progressPercent: calculatePercent(totalRequiredUnits - totalRemainingUnits, totalRequiredUnits),
      warnings: []
    };
  }

  function buildTree({
    itemId,
    owned = {},
    treeProgress = {},
    recipePreferences = {}
  } = {}) {
    const resolvedItemId = resolveItemId(itemId);

    if (!itemsById.has(resolvedItemId)) {
      return { tree: null, warnings: ["ITEM_NOT_FOUND"] };
    }

    const pool = createOwnedPool(owned);

    return {
      tree: buildTreeNode({
        itemId: resolvedItemId,
        quantity: 1,
        path: resolvedItemId,
        treeProgress,
        recipePreferences,
        pool
      }),
      warnings: []
    };
  }

  function buildList({
    itemId,
    owned = {},
    treeProgress = {},
    recipePreferences = {}
  } = {}) {
    const resolvedItemId = resolveItemId(itemId);

    if (!itemsById.has(resolvedItemId)) {
      return { items: [], warnings: ["ITEM_NOT_FOUND"] };
    }

    const pool = createOwnedPool(owned);
    const listItems = new Map();

    collectListItems({
      itemId: resolvedItemId,
      quantity: 1,
      path: resolvedItemId,
      treeProgress,
      recipePreferences,
      pool,
      listItems
    });

    return {
      items: [...listItems.values()].sort(sortListItems),
      warnings: []
    };
  }

  function calculateProgress(payload = {}) {
    return calculateBaseMaterials(payload);
  }

  function validateData() {
    const warnings = [];
    const tabIds = new Set(data.tabs.map((tab) => tab.id));
    const itemIds = new Set(data.items.map((item) => item.id));

    for (const item of data.items) {
      if (!/^[a-z0-9-]+$/.test(item.id)) {
        warnings.push(`INVALID_ITEM_ID:${item.id}`);
      }

      for (const tabId of item.tabs ?? []) {
        if (!tabIds.has(tabId)) {
          warnings.push(`UNKNOWN_TAB:${item.id}:${tabId}`);
        }
      }
    }

    for (const recipe of data.recipes) {
      if (!itemIds.has(recipe.resultItemId)) {
        warnings.push(`UNKNOWN_RECIPE_RESULT:${recipe.id}`);
      }

      if (!tabIds.has(recipe.sourceTabId)) {
        warnings.push(`UNKNOWN_RECIPE_TAB:${recipe.id}`);
      }

      for (const material of recipe.materials ?? []) {
        if (!itemIds.has(material.itemId)) {
          warnings.push(`UNKNOWN_RECIPE_MATERIAL:${recipe.id}:${material.itemId}`);
        }
      }
    }

    for (const itemId of Object.values(data.aliases ?? {})) {
      if (!itemIds.has(itemId)) {
        warnings.push(`UNKNOWN_ALIAS_TARGET:${itemId}`);
      }
    }

    return warnings;
  }

  function buildTreeNode({
    itemId,
    quantity,
    path,
    treeProgress,
    recipePreferences,
    pool
  }) {
    const item = itemsById.get(itemId);
    const recipe = getRecipeForItem(itemId, recipePreferences);
    const treeOwned = Boolean(treeProgress[path]);
    const ownedFromPool = !treeOwned ? consumeFromPool(pool, itemId, quantity) : 0;
    const ownedQuantity = treeOwned ? quantity : ownedFromPool;
    const completed = ownedQuantity >= quantity;
    const children = completed || !recipe ? [] : recipe.materials.map((material, index) => buildTreeNode({
      itemId: material.itemId,
      quantity: material.quantity * quantity,
      path: `${path}.${index}`,
      treeProgress,
      recipePreferences,
      pool
    }));

    return {
      nodeId: path,
      itemId,
      name: item?.name ?? itemId,
      type: item?.type ?? "material",
      level: item?.level ?? null,
      icon: item?.icon ?? "",
      quantity,
      ownedQuantity,
      completed,
      ownedSource: treeOwned ? "tree" : ownedFromPool > 0 ? "global" : null,
      recipeId: recipe?.id ?? "",
      children
    };
  }

  function collectBaseMaterials({
    itemId,
    quantity,
    path,
    treeProgress,
    recipePreferences,
    pool,
    required,
    respectOwned = true
  }) {
    const recipe = getRecipeForItem(itemId, recipePreferences);

    if (respectOwned) {
      const ownedQuantity = treeProgress[path] ? quantity : consumeFromPool(pool, itemId, quantity);

      if (ownedQuantity >= quantity) {
        return;
      }

      quantity -= ownedQuantity;
    }

    if (!recipe) {
      addToMap(required, itemId, quantity);

      return;
    }

    for (const [index, material] of recipe.materials.entries()) {
      collectBaseMaterials({
        itemId: material.itemId,
        quantity: material.quantity * quantity,
        path: `${path}.${index}`,
        treeProgress,
        recipePreferences,
        pool,
        required,
        respectOwned
      });
    }
  }

  function collectListItems({
    itemId,
    quantity,
    path,
    treeProgress,
    recipePreferences,
    pool,
    listItems
  }) {
    const item = itemsById.get(itemId);
    const recipe = getRecipeForItem(itemId, recipePreferences);
    const treeOwned = Boolean(treeProgress[path]);
    const ownedQuantity = treeOwned ? quantity : consumeFromPool(pool, itemId, quantity);
    const existing = listItems.get(itemId) ?? {
      itemId,
      name: item?.name ?? itemId,
      type: item?.type ?? "material",
      level: item?.level ?? null,
      icon: item?.icon ?? "",
      requiredQuantity: 0,
      ownedQuantity: 0,
      missingQuantity: 0
    };

    existing.requiredQuantity += quantity;
    existing.ownedQuantity += ownedQuantity;
    existing.missingQuantity = Math.max(existing.requiredQuantity - existing.ownedQuantity, 0);
    listItems.set(itemId, existing);

    if (ownedQuantity >= quantity || !recipe) {
      return;
    }

    const missingMultiplier = quantity - ownedQuantity;

    for (const [index, material] of recipe.materials.entries()) {
      collectListItems({
        itemId: material.itemId,
        quantity: material.quantity * missingMultiplier,
        path: `${path}.${index}`,
        treeProgress,
        recipePreferences,
        pool,
        listItems
      });
    }
  }

  function getRecipeForItem(itemId, recipePreferences = {}) {
    const preferredRecipeId = recipePreferences[itemId];
    const recipes = getRecipesForItem(itemId);

    return recipes.find((recipe) => recipe.id === preferredRecipeId) ?? recipes[0] ?? null;
  }

  function getRecipesForItem(itemId) {
    return recipesByResultId.get(itemId) ?? [];
  }

  function resolveItemId(value = "") {
    if (itemsById.has(value)) {
      return value;
    }

    const normalizedValue = normalizeText(value);

    return aliasesByNormalizedName.get(normalizedValue) ?? itemIdsByNormalizedName.get(normalizedValue) ?? value;
  }

  function toBookSummary(book, owned = {}, recipePreferences = {}) {
    return {
      ...book,
      ownedQuantity: getOwnedQuantity(owned, book.id),
      recipeCount: getRecipesForItem(book.id).length,
      selectedRecipeId: getRecipeForItem(book.id, recipePreferences)?.id ?? ""
    };
  }

  function materialEntries(map) {
    return [...map.entries()]
      .map(([itemId, quantity]) => ({
        itemId,
        quantity,
        item: itemsById.get(itemId) ?? null
      }))
      .sort((a, b) => (a.item?.name ?? a.itemId).localeCompare(b.item?.name ?? b.itemId, "pt-BR"));
  }

  return {
    getInitialState,
    filterBooks,
    getItem,
    calculateBaseMaterials,
    buildTree,
    buildList,
    calculateProgress,
    validateData,
    resolveItemId
  };
}

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function groupBy(items, key) {
  const groups = new Map();

  for (const item of items) {
    const groupKey = item[key];
    const group = groups.get(groupKey) ?? [];

    group.push(item);
    groups.set(groupKey, group);
  }

  return groups;
}

function createOwnedPool(owned = {}) {
  return Object.fromEntries(
    Object.entries(owned)
      .map(([itemId, quantity]) => [itemId, Math.max(Number(quantity) || 0, 0)])
      .filter(([, quantity]) => quantity > 0)
  );
}

function getOwnedQuantity(owned = {}, itemId) {
  return Math.max(Number(owned[itemId]) || 0, 0);
}

function consumeFromPool(pool, itemId, quantity) {
  const available = Math.max(Number(pool[itemId]) || 0, 0);
  const consumed = Math.min(available, quantity);

  pool[itemId] = available - consumed;

  return consumed;
}

function countOwnedBooks(owned = {}, books = []) {
  const bookIds = new Set(books.map((book) => book.id));

  return Object.entries(owned)
    .filter(([itemId, quantity]) => bookIds.has(itemId) && Number(quantity) > 0)
    .length;
}

function addToMap(map, itemId, quantity) {
  map.set(itemId, (map.get(itemId) ?? 0) + quantity);
}

function sumMapValues(map) {
  return [...map.values()].reduce((total, quantity) => total + quantity, 0);
}

function calculatePercent(done, total) {
  return total > 0 ? Math.min(100, Math.max(0, Math.round((done / total) * 100))) : 100;
}

function emptyCalculation(warnings = []) {
  return {
    required: [],
    missing: [],
    progressPercent: 0,
    warnings
  };
}

function sortListItems(a, b) {
  if (a.type !== b.type) {
    return a.type === "material" ? 1 : -1;
  }

  if ((a.level ?? 0) !== (b.level ?? 0)) {
    return (b.level ?? 0) - (a.level ?? 0);
  }

  return a.name.localeCompare(b.name, "pt-BR");
}
