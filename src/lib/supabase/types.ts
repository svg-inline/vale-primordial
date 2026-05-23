export interface Database {
  public: {
    Tables: {
      divine_book_tabs: {
        Row: {
          id: string;
          label: string;
          sort_order: number;
        };
      };
      items: {
        Row: {
          id: string;
          type: "divine-book" | "material";
          name: string;
          level: number | null;
          icon: string | null;
          description: string | null;
          effects: string[] | null;
          tabs: string[] | null;
        };
      };
      recipes: {
        Row: {
          id: string;
          result_item_id: string;
          sort_order: number;
        };
      };
      recipe_materials: {
        Row: {
          id: string;
          recipe_id: string;
          item_id: string;
          quantity: number;
          sort_order: number;
        };
      };
    };
  };
}
