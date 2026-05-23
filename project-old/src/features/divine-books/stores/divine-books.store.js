export const divineBooksStorageKey = "pw-helper:divine-books:v1";

export const divineBooksInitialState = {
  owned: {},
  treeProgressByRoot: {},
  recipePreferences: {},
  presets: {},
  filters: {
    tabId: "all",
    query: "",
    stat: "",
    ownedMode: "all"
  }
};

export function readDivineBooksState(catalog = {}) {
  const storedState = readJson(divineBooksStorageKey);

  if (storedState && typeof storedState === "object") {
    return normalizeState(storedState);
  }

  return migrateLegacyState(catalog);
}

export function writeDivineBooksState(state) {
  const nextState = normalizeState(state);

  try {
    localStorage.setItem(divineBooksStorageKey, JSON.stringify(nextState));
  } catch {
    // Local state can fail in private browsing or restricted webviews.
  }

  return nextState;
}

export function updateOwnedQuantity(state, itemId, delta) {
  const nextState = cloneState(state);
  const currentQuantity = Number(nextState.owned[itemId]) || 0;
  const nextQuantity = Math.max(currentQuantity + delta, 0);

  if (nextQuantity > 0) {
    nextState.owned[itemId] = nextQuantity;
  } else {
    delete nextState.owned[itemId];
  }

  return writeDivineBooksState(nextState);
}

export function setTreeNodeProgress(state, rootItemId, nodeId, value) {
  const nextState = cloneState(state);
  const treeProgress = { ...(nextState.treeProgressByRoot[rootItemId] ?? {}) };

  if (value) {
    treeProgress[nodeId] = true;
  } else {
    delete treeProgress[nodeId];
  }

  nextState.treeProgressByRoot[rootItemId] = treeProgress;

  return writeDivineBooksState(nextState);
}

export function resetTreeProgress(state, rootItemId) {
  const nextState = cloneState(state);

  delete nextState.treeProgressByRoot[rootItemId];

  return writeDivineBooksState(nextState);
}

export function setRecipePreference(state, itemId, recipeId) {
  const nextState = cloneState(state);

  if (recipeId) {
    nextState.recipePreferences[itemId] = recipeId;
  } else {
    delete nextState.recipePreferences[itemId];
  }

  return writeDivineBooksState(nextState);
}

export function savePreset(state, name) {
  const presetName = name.trim();

  if (!presetName) {
    return state;
  }

  const nextState = cloneState(state);

  nextState.presets[presetName] = {
    owned: { ...nextState.owned },
    recipePreferences: { ...nextState.recipePreferences }
  };

  return writeDivineBooksState(nextState);
}

export function loadPreset(state, name) {
  const preset = state.presets?.[name];

  if (!preset) {
    return state;
  }

  return writeDivineBooksState({
    ...state,
    owned: normalizeQuantityMap(preset.owned ?? {}),
    recipePreferences: normalizeStringMap(preset.recipePreferences ?? {})
  });
}

export function deletePreset(state, name) {
  const nextState = cloneState(state);

  delete nextState.presets[name];

  return writeDivineBooksState(nextState);
}

export function importDivineBooksState(encodedValue) {
  const decoded = JSON.parse(decodeURIComponent(escape(atob(encodedValue))));

  return writeDivineBooksState(decoded);
}

export function exportDivineBooksState(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(normalizeState(state)))));
}

function migrateLegacyState(catalog = {}) {
  const legacyOwned = readJson("pw_owned", []);
  const legacyPresets = readJson("pw_presets", {});
  const nameToId = createNameToIdMap(catalog);
  const owned = {};
  const presets = {};

  for (const value of Array.isArray(legacyOwned) ? legacyOwned : []) {
    const name = String(value).startsWith("@") ? String(value).split("|").at(-1) : String(value);
    const itemId = nameToId.get(normalizeName(name));

    if (itemId) {
      owned[itemId] = (owned[itemId] ?? 0) + 1;
    }
  }

  for (const [presetName, values] of Object.entries(legacyPresets ?? {})) {
    const presetOwned = {};

    for (const value of Array.isArray(values) ? values : []) {
      const name = String(value).startsWith("@") ? String(value).split("|").at(-1) : String(value);
      const itemId = nameToId.get(normalizeName(name));

      if (itemId) {
        presetOwned[itemId] = (presetOwned[itemId] ?? 0) + 1;
      }
    }

    presets[presetName] = {
      owned: presetOwned,
      recipePreferences: {}
    };
  }

  return writeDivineBooksState({
    ...divineBooksInitialState,
    owned,
    presets
  });
}

function normalizeState(state = {}) {
  return {
    owned: normalizeQuantityMap(state.owned),
    treeProgressByRoot: normalizeTreeProgress(state.treeProgressByRoot),
    recipePreferences: normalizeStringMap(state.recipePreferences),
    presets: normalizePresets(state.presets),
    filters: {
      ...divineBooksInitialState.filters,
      ...(state.filters ?? {})
    }
  };
}

function cloneState(state) {
  return normalizeState(JSON.parse(JSON.stringify(state ?? divineBooksInitialState)));
}

function normalizeQuantityMap(value = {}) {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .map(([itemId, quantity]) => [itemId, Math.max(Number(quantity) || 0, 0)])
      .filter(([, quantity]) => quantity > 0)
  );
}

function normalizeTreeProgress(value = {}) {
  return Object.fromEntries(
    Object.entries(value ?? {}).map(([rootItemId, progress]) => [
      rootItemId,
      Object.fromEntries(
        Object.entries(progress ?? {})
          .filter(([, done]) => Boolean(done))
          .map(([nodeId]) => [nodeId, true])
      )
    ])
  );
}

function normalizeStringMap(value = {}) {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .filter(([, nextValue]) => typeof nextValue === "string" && nextValue)
  );
}

function normalizePresets(value = {}) {
  return Object.fromEntries(
    Object.entries(value ?? {}).map(([name, preset]) => [
      name,
      {
        owned: normalizeQuantityMap(preset?.owned ?? {}),
        recipePreferences: normalizeStringMap(preset?.recipePreferences ?? {})
      }
    ])
  );
}

function readJson(key, fallbackValue = null) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function createNameToIdMap(catalog = {}) {
  const entries = [
    ...(catalog.books ?? []),
    ...(catalog.materials ?? []),
    ...(catalog.items ?? [])
  ];
  const map = new Map(entries.map((item) => [normalizeName(item.name), item.id]));

  for (const [alias, itemId] of Object.entries(catalog.aliases ?? {})) {
    map.set(normalizeName(alias), itemId);
  }

  return map;
}

function normalizeName(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
