import { describe, expect, it } from "vitest";
import { filterDuskDrops, getDuskDropsCatalogServer } from "../../src/lib/queries/dusk-drops";
import type { DuskDropFilters } from "../../src/types/dusk-drops";

const catalog = getDuskDropsCatalogServer();

const baseFilters: DuskDropFilters = {
  query: "",
  chapter: "all",
  dusk: "all",
  boss: "all",
  mode: "all",
  dropTable: "all",
  sort: "name",
};

describe("dusk drops filters", () => {
  it("returns the full catalog with default filters", () => {
    expect(filterDuskDrops(catalog, baseFilters)).toHaveLength(85);
  });

  it("filters by dusk instance and boss", () => {
    const results = filterDuskDrops(catalog, {
      ...baseFilters,
      dusk: "1-1",
      boss: "quin-tian",
    });

    expect(results.map((item) => item.id)).toEqual(["lamina-de-qin-tian"]);
  });

  it("matches accent-insensitive search text", () => {
    const results = filterDuskDrops(catalog, {
      ...baseFilters,
      query: "lamina de qin",
    });

    expect(results.some((item) => item.id === "lamina-de-qin-tian")).toBe(true);
  });
});
