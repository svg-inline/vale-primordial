import { describe, expect, it } from "vitest";
import fs from "node:fs";

import divineBooksData from "../data/divine-books.json";
import { createDivineBooksService } from "../worker/divine-books.calculator.js";

const service = createDivineBooksService(divineBooksData);

describe("divine books data", () => {
  it("keeps normalized tabs, books, recipes, and aliases", () => {
    const initialState = service.getInitialState();
    const duplicateBook = service.getItem({ itemId: "divine-book-agua-gentil" });

    expect(initialState.tabs).toHaveLength(7);
    expect(initialState.books).toHaveLength(74);
    expect(initialState.materials).toHaveLength(4);
    expect(divineBooksData.recipes).toHaveLength(78);
    expect(duplicateBook.recipes).toHaveLength(2);
    expect(service.validateData()).toEqual([]);
    expect(service.resolveItemId("Espinho de Rosa")).toBe("divine-book-espinhos-de-rosa");
    expect(service.resolveItemId("Fonte do deserto")).toBe("divine-book-fonte-do-deserto");
    expect(service.resolveItemId("Risada de Loucura")).toBe("divine-book-risada-da-loucura");
    expect(service.resolveItemId("Frangância dos Céus")).toBe("divine-book-fragrancia-dos-ceus");
  });

  it("references copied public assets", () => {
    for (const item of divineBooksData.items) {
      expect(item.icon).toMatch(/^assets\/divine-books\//);
      expect(fs.existsSync(`public/${item.icon}`)).toBe(true);
    }
  });
});

describe("divine books calculations", () => {
  it("calculates base materials for a level one book", () => {
    const result = service.calculateBaseMaterials({
      itemId: "divine-book-poder-interno",
      owned: {}
    });

    expect(toQuantityMap(result.missing)).toEqual({
      "material-fragmentos-de-escrita-divina": 3,
      "material-livros-em-branco-divino": 4
    });
    expect(result.progressPercent).toBe(0);
  });

  it("discounts owned intermediate books from remaining base materials", () => {
    const result = service.calculateBaseMaterials({
      itemId: "divine-book-resiliencia",
      owned: {
        "divine-book-poder-interno": 1
      }
    });

    expect(toQuantityMap(result.required)).toEqual({
      "material-fragmentos-de-escrita-divina": 9,
      "material-livros-em-branco-divino": 12
    });
    expect(toQuantityMap(result.missing)).toEqual({
      "material-fragmentos-de-escrita-divina": 6,
      "material-livros-em-branco-divino": 8
    });
    expect(result.progressPercent).toBe(33);
  });

  it("uses recipe preferences for duplicated books", () => {
    const alternateRecipeId = "recipe-divine-books-tab-6-agua-gentil-2";
    const result = service.calculateBaseMaterials({
      itemId: "divine-book-agua-gentil",
      recipePreferences: {
        "divine-book-agua-gentil": alternateRecipeId
      }
    });

    expect(toQuantityMap(result.missing)).toEqual({
      "material-manuscrito-do-destino": 1
    });
  });

  it("builds list progress from tree-specific progress", () => {
    const result = service.buildList({
      itemId: "divine-book-resiliencia",
      treeProgress: {
        "divine-book-resiliencia.0": true
      }
    });
    const poderInterno = result.items.find((item) => item.itemId === "divine-book-poder-interno");

    expect(poderInterno).toMatchObject({
      requiredQuantity: 1,
      ownedQuantity: 1,
      missingQuantity: 0
    });
  });
});

function toQuantityMap(entries) {
  return Object.fromEntries(entries.map((entry) => [entry.itemId, entry.quantity]));
}
