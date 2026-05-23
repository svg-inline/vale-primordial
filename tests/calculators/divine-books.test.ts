import { describe, expect, it } from "vitest";
import catalog from "../../src/lib/data/divine-books.json";
import { createDivineBooksService } from "../../src/lib/calculators/divine-books.js";

describe("divine books calculator migration", () => {
  const service = createDivineBooksService(catalog);

  it("validates the migrated catalog", () => {
    expect(service.validateData()).toEqual([]);
  });

  it("filters books by query", () => {
    const result = service.filterBooks({
      filters: {
        tabId: "all",
        query: "Poder Interno",
        stat: "",
        ownedMode: "all",
      },
    });

    expect(result.books.map((book) => book.id)).toContain("divine-book-poder-interno");
  });

  it("calculates missing materials from empty inventory", () => {
    const result = service.calculateBaseMaterials({
      itemId: "divine-book-poder-interno",
      owned: {},
    });

    expect(result.warnings).toEqual([]);
    expect(result.required.length).toBeGreaterThan(0);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.progressPercent).toBe(0);
  });

  it("uses owned inventory when calculating progress", () => {
    const result = service.calculateBaseMaterials({
      itemId: "divine-book-poder-interno",
      owned: {
        "divine-book-poder-interno": 1,
      },
    });

    expect(result.missing).toEqual([]);
    expect(result.progressPercent).toBe(100);
  });

  it("builds a material tree for a book", () => {
    const result = service.buildTree({
      itemId: "divine-book-poder-interno",
      owned: {},
    });

    expect(result.warnings).toEqual([]);
    expect(result.tree?.itemId).toBe("divine-book-poder-interno");
    expect(result.tree?.children.length).toBeGreaterThan(0);
  });
});
