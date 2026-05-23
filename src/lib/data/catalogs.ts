import divineBooks from "./divine-books.json";
import duskDrops from "./dusk-drops.json";
import equipments from "./equipments.json";
import stones from "./stones.json";
import type { DivineBookCatalog } from "@/types/divine-books";
import type { DuskDropsCatalog } from "@/types/dusk-drops";

export function getDivineBookCatalog(): DivineBookCatalog {
  return divineBooks as DivineBookCatalog;
}

export function getDuskDropsCatalog(): DuskDropsCatalog {
  return duskDrops as DuskDropsCatalog;
}

export function getEquipmentsCatalog() {
  return equipments as unknown[];
}

export function getStonesCatalog() {
  return stones as unknown[];
}
