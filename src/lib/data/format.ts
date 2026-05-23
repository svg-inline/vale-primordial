export function assetPath(path?: string | null) {
  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
