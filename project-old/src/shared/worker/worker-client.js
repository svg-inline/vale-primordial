let dataWorker;
let nextMessageId = 1;
const pendingMessages = new Map();

export function sendFeatureMessage({ feature, action, payload = {} }) {
  const worker = getDataWorker();
  const id = nextMessageId++;

  return new Promise((resolve, reject) => {
    pendingMessages.set(id, { resolve, reject });
    worker.postMessage({ id, feature, action, payload });
  });
}

function getDataWorker() {
  if (dataWorker) {
    return dataWorker;
  }

  dataWorker = new Worker(new URL("./data.worker.js", import.meta.url), {
    type: "module"
  });

  dataWorker.addEventListener("message", (event) => {
    const message = event.data ?? {};
    const pending = pendingMessages.get(message.id);

    if (!pending) {
      return;
    }

    pendingMessages.delete(message.id);

    if (message.action === "ERROR") {
      pending.reject(new Error(message.error?.message ?? "Worker error"));
      return;
    }

    pending.resolve(message.payload);
  });

  return dataWorker;
}
