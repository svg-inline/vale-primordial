import equipments from "../data/equipments.json";

const handlers = {
  LIST_EQUIPMENTS: () => ({ equipments }),
  CALCULATE_EQUIPMENT: ({ equipmentIds = [] } = {}) => ({
    equipmentIds,
    materials: [],
    warnings: equipmentIds.length ? [] : ["NO_EQUIPMENT_SELECTED"]
  })
};

export function equipmentHandlers({ action, payload = {} } = {}) {
  const handler = handlers[action];

  if (!handler) {
    throw new Error(`Unknown equipments action: ${action}`);
  }

  return handler(payload);
}
