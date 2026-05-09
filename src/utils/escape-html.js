const htmlEscapes = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

export function escapeAttribute(value = "") {
  return escapeHtml(value);
}
