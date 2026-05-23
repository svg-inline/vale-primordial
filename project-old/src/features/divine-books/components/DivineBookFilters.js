import Search from "lucide/dist/esm/icons/search.mjs";
import X from "lucide/dist/esm/icons/x.mjs";
import { Button } from "../../../shared/components/ui/Button.js";
import { Icon } from "../../../shared/components/ui/Icon.js";
import { Input } from "../../../shared/components/ui/Input.js";
import { Select } from "../../../shared/components/ui/Select.js";
import { escapeHtml } from "../../../shared/utils/escape-html.js";
import { dataAttributes } from "../../../shared/utils/html.js";
import { t } from "../../../shared/i18n/index.js";

export const divineBookStatOptions = [
  "",
  "For",
  "Dex",
  "Con",
  "Int",
  "Mov",
  "Crítico",
  "HP",
  "MP",
  "Recup",
  "Exp",
  "Invoc",
  "Red",
  "Vel"
];

export function DivineBookFilters({
  tabs = [],
  filters = {},
  stats = {},
  statSelectOpen = false
} = {}) {
  const ownedModes = ["all", "owned", "missing"];

  return `
    <aside class="app-surface grid gap-5 p-4 md:sticky md:top-4 md:self-start">
      <div class="grid gap-1">
        <h2 class="text-lg font-extrabold">${escapeHtml(t("divineBooks.filters.title"))}</h2>
        <p class="app-muted text-sm">${escapeHtml(t("divineBooks.stats.summary", stats))}</p>
      </div>

      <div class="relative">
        ${Input({
          id: "divine-book-search",
          label: t("fields.search.label"),
          value: filters.query ?? "",
          placeholder: t("divineBooks.search.placeholder"),
          action: "changeDivineBookQuery"
        })}
        <span class="pointer-events-none absolute bottom-[0.86rem] right-3 text-text-muted">${Icon({ icon: Search, size: 16 })}</span>
      </div>

      ${Select({
        id: "divine-book-stat",
        label: t("divineBooks.filters.stat"),
        value: filters.stat ?? "",
        placeholder: t("divineBooks.filters.allStats"),
        open: statSelectOpen,
        action: "toggleDivineBookStatSelect",
        optionAction: "selectDivineBookStat",
        options: divineBookStatOptions.map((value) => ({
          value,
          label: value ? t(`divineBooks.stats.${value}`) : t("divineBooks.filters.allStats")
        }))
      })}

      <div class="grid gap-2">
        <span class="text-sm font-bold text-text">${escapeHtml(t("divineBooks.filters.status"))}</span>
        <div class="flex flex-wrap gap-2">
          ${ownedModes.map((mode) => `
            <button
              type="button"
              class="app-toggle ${filters.ownedMode === mode ? "app-toggle--pressed" : ""}"
              aria-pressed="${filters.ownedMode === mode ? "true" : "false"}"
              ${dataAttributes({ action: "selectDivineBookOwnedMode", value: mode })}
            >${escapeHtml(t(`divineBooks.ownedModes.${mode}`))}</button>
          `).join("")}
        </div>
      </div>

      <div class="grid gap-2">
        <span class="text-sm font-bold text-text">${escapeHtml(t("divineBooks.filters.tabs"))}</span>
        <div class="flex max-h-48 flex-wrap gap-2 overflow-auto pr-1">
          ${[{ id: "all", label: t("divineBooks.filters.allTabs") }, ...tabs].map((tab) => `
            <button
              type="button"
              class="app-toggle ${filters.tabId === tab.id ? "app-toggle--pressed" : ""}"
              aria-pressed="${filters.tabId === tab.id ? "true" : "false"}"
              ${dataAttributes({ action: "selectDivineBookTab", tabId: tab.id })}
            >${escapeHtml(tab.label)}</button>
          `).join("")}
        </div>
      </div>

      ${Button({
        label: t("actions.clear"),
        variant: "ghost",
        icon: X,
        action: "clearDivineBookFilters"
      })}
    </aside>
  `;
}
