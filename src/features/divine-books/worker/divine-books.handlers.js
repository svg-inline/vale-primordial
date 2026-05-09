import divineBooks from "../data/divine-books.json";

const handlers = {
  LIST_BOOKS: () => ({ books: divineBooks }),
  CALCULATE_TREE: ({ bookId = "", owned = {} } = {}) => ({
    bookId,
    owned,
    required: [],
    missing: [],
    warnings: divineBooks.some((book) => book.id === bookId) ? [] : ["BOOK_NOT_FOUND"]
  })
};

export function divineBooksHandlers({ action, payload = {} } = {}) {
  const handler = handlers[action];

  if (!handler) {
    throw new Error(`Unknown divineBooks action: ${action}`);
  }

  return handler(payload);
}
