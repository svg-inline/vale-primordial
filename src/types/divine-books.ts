export interface DivineBooksTab {
  id: string;
  label: string;
  sortOrder: number;
}

export interface DivineBooksItem {
  id: string;
  type: "divine-book" | "material";
  name: string;
  level: number | null;
  icon: string;
  effects: string[];
  tabs: string[];
}

export interface DivineBooksRecipeMaterial {
  itemId: string;
  quantity: number;
}

export interface DivineBooksRecipe {
  id: string;
  resultItemId: string;
  sourceTabId: string;
  sortOrder?: number;
  materials: DivineBooksRecipeMaterial[];
}

export interface DivineBookCatalog {
  schemaVersion: number;
  feature: string;
  tabs: DivineBooksTab[];
  items: DivineBooksItem[];
  recipes: DivineBooksRecipe[];
  aliases?: Record<string, string>;
}

export interface DivineBookSummary extends DivineBooksItem {
  ownedQuantity: number;
  recipeCount: number;
  selectedRecipeId: string;
}

export interface DivineBookFilters {
  tabId: string;
  query: string;
  stat: string;
  ownedMode: "all" | "owned" | "missing";
}

export interface DivineBookMaterialEntry {
  itemId: string;
  quantity: number;
  item: DivineBooksItem | null;
}

export interface DivineBookMaterialsResult {
  required: DivineBookMaterialEntry[];
  missing: DivineBookMaterialEntry[];
  progressPercent: number;
  warnings: string[];
}

export interface DivineBookTreeNode {
  nodeId: string;
  itemId: string;
  name: string;
  type: "divine-book" | "material";
  level: number | null;
  icon: string;
  quantity: number;
  ownedQuantity: number;
  completed: boolean;
  ownedSource: "tree" | "global" | null;
  recipeId: string;
  children: DivineBookTreeNode[];
}

export interface DivineBookListEntry {
  itemId: string;
  name: string;
  type: "divine-book" | "material";
  level: number | null;
  icon: string;
  requiredQuantity: number;
  ownedQuantity: number;
  missingQuantity: number;
}
