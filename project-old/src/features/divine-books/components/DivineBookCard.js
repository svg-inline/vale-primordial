import Check from "lucide/dist/esm/icons/check.mjs";
import Hammer from "lucide/dist/esm/icons/hammer.mjs";
import Library from "lucide/dist/esm/icons/library.mjs";
import Plus from "lucide/dist/esm/icons/plus.mjs";
import { Icon } from "../../../shared/components/ui/Icon.js";
import { escapeHtml } from "../../../shared/utils/escape-html.js";
import { dataAttributes } from "../../../shared/utils/html.js";
import { t } from "../../../shared/i18n/index.js";

export function DivineBookCard({ book = {}, assetUrl = (value) => value } = {}) {
  const ownedQuantity = Number(book.ownedQuantity) || 0;
  const owned = ownedQuantity > 0;

  return `
    <article class="app-surface relative grid gap-3 overflow-hidden p-4 ${owned ? "ring-1 ring-accent" : ""}">
      <button
        type="button"
        class="absolute inset-0 z-10 cursor-pointer"
        aria-label="${escapeHtml(t("divineBooks.actions.openDetails", { name: book.name }))}"
        ${dataAttributes({ action: "openDivineBook", itemId: book.id })}
      ></button>
      <div class="relative z-20 flex gap-3">
        <img
          class="size-12 rounded-md border border-border bg-surface-muted object-contain p-1"
          src="${escapeHtml(assetUrl(book.icon))}"
          alt=""
          loading="lazy"
        >
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <h2 class="min-w-0 text-base font-extrabold leading-tight text-text">${escapeHtml(book.name ?? "")}</h2>
            ${owned ? `<span class="inline-flex items-center gap-1 rounded border border-accent/50 bg-accent-soft px-2 py-1 text-xs font-bold text-accent">${Icon({ icon: Check, size: 14 })}${escapeHtml(ownedQuantity)}</span>` : ""}
          </div>
          <p class="app-muted mt-1 text-xs font-bold uppercase">${escapeHtml(t("divineBooks.level", { level: book.level ?? "-" }))}</p>
        </div>
      </div>
      <div class="relative z-20 flex flex-wrap gap-1">
        ${(book.effects ?? []).map((effect) => `<span class="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-accent">${escapeHtml(effect)}</span>`).join("")}
      </div>
      <div class="relative z-20 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span class="app-muted inline-flex items-center gap-1 text-xs font-bold">
          ${Icon({ icon: book.recipeCount > 1 ? Library : Hammer, size: 14 })}
          ${escapeHtml(t(book.recipeCount > 1 ? "divineBooks.recipes.multiple" : "divineBooks.recipes.single", { count: book.recipeCount ?? 0 }))}
        </span>
        <button
          type="button"
          class="app-button app-button--sm ${owned ? "app-button--secondary" : "app-button--primary"} relative z-30"
          ${dataAttributes({ action: "increaseOwned", itemId: book.id })}
        >
          <span class="app-button__icon">${Icon({ icon: Plus, size: 16 })}</span>
          <span>${escapeHtml(t("divineBooks.actions.markOwned"))}</span>
        </button>
      </div>
    </article>
  `;
}
