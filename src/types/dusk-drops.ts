export interface DuskDropsMeta {
  title: string;
  source: string;
  fetchedAt: string;
  version: string;
  notes: string;
}

export interface DuskChapter {
  id: string;
  name: string;
}

export interface DuskInstance {
  id: string;
  chapter: string;
  name: string;
  level: string;
  slug: string;
  label: string;
  items: string[];
  bosses: string[];
  itemsCount: number;
  bossesCount: number;
}

export interface DuskBoss {
  id: string;
  name: string;
  slug: string;
  chapter: string;
  chapterName: string;
  image: string;
  imageUrl?: string;
  quantityOption: string;
  drops: string[];
  dusks: string[];
  aliases: string[];
  dropsCount: number;
}

export interface DuskDropItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  imageUrl: string;
  droppedBy: string;
  bossId: string;
  bossName: string;
  sourceId: string;
  sourceType: "boss" | "environment" | "unknown";
  dusks: string[];
  duskText: string;
  modes: string[];
  dropTable: string;
  tableIndex: number;
  searchText: string;
}

export interface DuskDropSource {
  id: string;
  name: string;
  type: "environment" | "unknown";
  items: string[];
  dusks: string[];
  itemsCount: number;
}

export interface DuskDropsCatalog {
  meta: DuskDropsMeta;
  chapters: DuskChapter[];
  dusks: DuskInstance[];
  bosses: DuskBoss[];
  items: DuskDropItem[];
  sources: DuskDropSource[];
  indexes: {
    itemById: Record<string, DuskDropItem>;
    bossById: Record<string, DuskBoss>;
    duskById: Record<string, DuskInstance>;
  };
}

export interface DuskDropFilters {
  query: string;
  chapter: string;
  dusk: string;
  boss: string;
  mode: string;
  dropTable: string;
  sort: "name" | "dusk" | "boss" | "table";
}
