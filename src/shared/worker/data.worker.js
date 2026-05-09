import { divineBooksHandlers } from "../../features/divine-books/worker/divine-books.handlers.js";
import { duskDropsHandlers } from "../../features/dusk-drops/worker/dusk-drops.handlers.js";
import { equipmentHandlers } from "../../features/equipments/worker/equipment.handlers.js";
import { stoneHandlers } from "../../features/stones/worker/stone.handlers.js";

export const featureHandlers = {
  divineBooks: divineBooksHandlers,
  duskDrops: duskDropsHandlers,
  equipments: equipmentHandlers,
  stones: stoneHandlers
};

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("message", async (event) => {
    const message = event.data ?? {};
    const id = message.id ?? null;

    try {
      const payload = await dispatchWorkerMessage(message);

      self.postMessage({
        id,
        feature: message.feature,
        action: `${message.action}_RESULT`,
        payload
      });
    } catch (error) {
      self.postMessage({
        id,
        feature: message.feature ?? null,
        action: "ERROR",
        error: {
          message: error instanceof Error ? error.message : "Worker error"
        }
      });
    }
  });
}

export async function dispatchWorkerMessage(message = {}) {
  const { feature, action, payload = {} } = message;

  if (!feature || !action) {
    throw new Error("Worker messages require feature and action.");
  }

  const handlers = featureHandlers[feature];

  if (!handlers) {
    throw new Error(`Unknown worker feature: ${feature}`);
  }

  return handlers({ action, payload });
}
