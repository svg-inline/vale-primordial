import divineBooks from "../data/divine-books.json";
import { createDivineBooksService } from "./divine-books.calculator.js";

const handlers = {
  GET_INITIAL_STATE: () => service.getInitialState(),
  FILTER: (payload) => service.filterBooks(payload),
  GET_ITEM: (payload) => service.getItem(payload),
  CALCULATE_BASE_MATERIALS: (payload) => service.calculateBaseMaterials(payload),
  BUILD_TREE: (payload) => service.buildTree(payload),
  BUILD_LIST: (payload) => service.buildList(payload),
  CALCULATE_PROGRESS: (payload) => service.calculateProgress(payload),
  VALIDATE_DATA: () => ({ warnings: service.validateData() }),
  LIST_BOOKS: () => ({ books: service.getInitialState().books }),
  CALCULATE_TREE: (payload) => service.buildTree(payload)
};

const service = createDivineBooksService(divineBooks);

export function divineBooksHandlers({ action, payload = {} } = {}) {
  const handler = handlers[action];

  if (!handler) {
    throw new Error(`Unknown divineBooks action: ${action}`);
  }

  return handler(payload);
}
