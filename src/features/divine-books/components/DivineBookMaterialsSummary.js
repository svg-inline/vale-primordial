import { escapeHtml } from "../../../shared/utils/escape-html.js";
import { t } from "../../../shared/i18n/index.js";

export function DivineBookMaterialsSummary({
  materials = [],
  progressPercent = 0,
  assetUrl = (value) => value
} = {}) {
  return `
    <section class="app-surface grid gap-4 p-4" aria-live="polite">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-extrabold">${escapeHtml(t("divineBooks.materials.title"))}</h3>
          <p class="app-muted text-sm">${escapeHtml(t("divineBooks.progress.percent", { percent: progressPercent }))}</p>
        </div>
        <span class="rounded border border-border bg-surface-muted px-3 py-1 text-sm font-black text-accent">${escapeHtml(String(progressPercent))}%</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div class="h-full rounded-full bg-accent" style="width: ${escapeHtml(progressPercent)}%"></div>
      </div>
      ${
        materials.length
          ? `<div class="grid gap-2 sm:grid-cols-2">
              ${materials.map((entry) => `
                <div class="flex items-center gap-3 rounded border border-border bg-surface-muted p-2">
                  <img class="size-8 rounded object-contain" src="${escapeHtml(assetUrl(entry.item?.icon ?? ""))}" alt="" loading="lazy">
                  <span class="min-w-0 flex-1 truncate text-sm font-bold">${escapeHtml(entry.item?.name ?? entry.itemId)}</span>
                  <span class="rounded bg-accent-soft px-2 py-1 text-sm font-black text-accent">${escapeHtml(entry.quantity)}x</span>
                </div>
              `).join("")}
            </div>`
          : `<p class="app-muted rounded border border-border bg-surface-muted p-3 text-sm">${escapeHtml(t("divineBooks.materials.empty"))}</p>`
      }
    </section>
  `;
}
