import { describe, expect, it } from "vitest";

import { dispatchWorkerMessage } from "./data.worker.js";

describe("data worker router", () => {
  it("routes feature messages to the matching handler", async () => {
    await expect(dispatchWorkerMessage({
      feature: "divineBooks",
      action: "BUILD_TREE",
      payload: {
        itemId: "divine-book-pan-gu",
        owned: {}
      }
    })).resolves.toMatchObject({
      tree: {
        itemId: "divine-book-pan-gu",
        name: "Pan gu"
      },
      warnings: []
    });
  });

  it("rejects unknown features", async () => {
    await expect(dispatchWorkerMessage({
      feature: "unknown",
      action: "LIST"
    })).rejects.toThrow("Unknown worker feature: unknown");
  });

  it("rejects unknown actions", async () => {
    await expect(dispatchWorkerMessage({
      feature: "divineBooks",
      action: "NOPE"
    })).rejects.toThrow("Unknown divineBooks action: NOPE");
  });
});
