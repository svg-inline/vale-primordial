import divineBooks from "./divine-books.json";
import duskDrops from "./dusk-drops.json";
import equipments from "./equipments.json";
import stones from "./stones.json";
import type { DivineBookCatalog } from "@/types/divine-books";

export function getDivineBookCatalog(): DivineBookCatalog {
  return divineBooks as DivineBookCatalog;
}

export function getDuskDropsCatalog() {
  return duskDrops as unknown[];
}

export function getEquipmentsCatalog() {
  return equipments as unknown[];
}

export function getStonesCatalog() {
  return stones as unknown[];
}
