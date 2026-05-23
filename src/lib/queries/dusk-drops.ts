import { getDuskDropsCatalog } from "../data/catalogs";
import { normalizeText } from "../data/format";
import type { DuskDropFilters, DuskDropItem, DuskDropsCatalog } from "@/types/dusk-drops";

export function getDuskDropsCatalogServer(): DuskDropsCatalog {
  return getDuskDropsCatalog();
}

export function filterDuskDrops(catalog: DuskDropsCatalog, filters: DuskDropFilters) {
  const query = normalizeText(filters.query);

  return sortDuskDrops(
    catalog.items.filter((item) => {
      if (query && !normalizeText(getDuskDropSearchText(item)).includes(query)) {
        return false;
      }

      if (filters.chapter !== "all") {
        const matchesChapter = item.dusks.some(
          (duskId) => catalog.indexes.duskById[duskId]?.chapter === filters.chapter,
        );

        if (!matchesChapter) {
          return false;
        }
      }

      if (filters.dusk !== "all" && !item.dusks.includes(filters.dusk)) {
        return false;
      }

      if (filters.boss !== "all" && item.bossId !== filters.boss) {
        return false;
      }

      if (filters.mode !== "all" && !item.modes.includes(filters.mode)) {
        return false;
      }

      if (filters.dropTable !== "all" && item.dropTable !== filters.dropTable) {
        return false;
      }

      return true;
    }),
    filters.sort,
  );
}

function getDuskDropSearchText(item: DuskDropItem) {
  return [
    item.name,
    item.droppedBy,
    item.bossName,
    item.duskText,
    item.dropTable,
    item.dusks.join(" "),
    item.modes.join(" "),
  ].join(" ");
}

function sortDuskDrops(items: DuskDropItem[], sort: DuskDropFilters["sort"]) {
  const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

  return [...items].sort((left, right) => {
    const values: Record<DuskDropFilters["sort"], [string, string]> = {
      name: [left.name, right.name],
      dusk: [left.duskText, right.duskText],
      boss: [left.droppedBy, right.droppedBy],
      table: [left.dropTable, right.dropTable],
    };

    const [leftValue, rightValue] = values[sort] ?? values.name;
    return collator.compare(leftValue, rightValue);
  });
}
