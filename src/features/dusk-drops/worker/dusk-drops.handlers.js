import duskDrops from "../data/dusk-drops.json";

const handlers = {
  LIST_DUSK_DROPS: () => ({ duskDrops }),
  FILTER_DUSK: ({ filters = {} } = {}) => ({
    filters,
    results: duskDrops
  })
};

export function duskDropsHandlers({ action, payload = {} } = {}) {
  const handler = handlers[action];

  if (!handler) {
    throw new Error(`Unknown duskDrops action: ${action}`);
  }

  return handler(payload);
}
