import { escapeHtml } from "../../../shared/utils/escape-html.js";

export function DivineBookCard({ book = {} } = {}) {
  return `
    <article class="app-surface grid gap-2 p-4">
      <h2 class="text-lg font-extrabold text-text">${escapeHtml(book.name ?? "")}</h2>
      <p class="app-muted text-sm">${escapeHtml(book.description ?? "")}</p>
    </article>
  `;
}
