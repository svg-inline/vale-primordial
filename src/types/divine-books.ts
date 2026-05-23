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
