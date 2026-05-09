import { describe, expect, it } from "vitest";

import { dispatchWorkerMessage } from "./data.worker.js";

describe("data worker router", () => {
  it("routes feature messages to the matching handler", async () => {
    await expect(dispatchWorkerMessage({
      feature: "divineBooks",
      action: "CALCULATE_TREE",
      payload: {
        bookId: "pangu",
        owned: {}
      }
    })).resolves.toEqual({
      bookId: "pangu",
      owned: {},
      required: [],
      missing: [],
      warnings: ["BOOK_NOT_FOUND"]
    });
  });

  it("rejects unknown features", async () => {
    await expect(dispatchWorkerMessage({
      feature: "unknown",
      action: "LIST"
    })).rejects.toThrow("Unknown worker feature: unknown");
  });
});
