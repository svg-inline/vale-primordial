import stones from "../data/stones.json";

const handlers = {
  LIST_STONES: () => ({ stones }),
  CALCULATE_STONES: ({ fromLevel = 1, toLevel = 1, quantity = 1 } = {}) => ({
    fromLevel,
    toLevel,
    quantity,
    requiredBaseStones: quantity,
    warnings: fromLevel <= toLevel ? [] : ["INVALID_STONE_RANGE"]
  })
};

export function stoneHandlers({ action, payload = {} } = {}) {
  const handler = handlers[action];

  if (!handler) {
    throw new Error(`Unknown stones action: ${action}`);
  }

  return handler(payload);
}
