import Check from "lucide/dist/esm/icons/check.mjs";
import Minus from "lucide/dist/esm/icons/minus.mjs";
import Plus from "lucide/dist/esm/icons/plus.mjs";
import RotateCcw from "lucide/dist/esm/icons/rotate-ccw.mjs";
import { Button } from "../../../shared/components/ui/Button.js";
import { Icon } from "../../../shared/components/ui/Icon.js";
import { escapeHtml } from "../../../shared/utils/escape-html.js";
import { dataAttributes } from "../../../shared/utils/html.js";
import { t } from "../../../shared/i18n/index.js";

export function DivineBookTreeView({
  rootItemId = "",
  tree = null,
  listItems = [],
  viewMode = "tree",
  assetUrl = (value) => value
} = {}) {
  if (!tree) {
    return "";
  }

  return `
    <section class="app-surface grid gap-4 p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-extrabold">${escapeHtml(t("divineBooks.tree.title", { name: tree.name }))}</h3>
          <p class="app-muted text-sm">${escapeHtml(t("divineBooks.tree.description"))}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${Button({
            label: t("divineBooks.tree.viewTree"),
            variant: viewMode === "tree" ? "primary" : "secondary",
            size: "sm",
            action: "setDivineBookTreeMode",
            data: { value: "tree" }
          })}
          ${Button({
            label: t("divineBooks.tree.viewList"),
            variant: viewMode === "list" ? "primary" : "secondary",
            size: "sm",
            action: "setDivineBookTreeMode",
            data: { value: "list" }
          })}
          ${Button({
            label: t("divineBooks.tree.reset"),
            variant: "danger",
            size: "sm",
            icon: RotateCcw,
            action: "resetDivineBookTree",
            data: { itemId: rootItemId }
          })}
        </div>
      </div>
      ${
        viewMode === "tree"
          ? `<div class="overflow-auto rounded border border-border bg-surface-muted p-4">
              <div class="flex min-w-max justify-center">${renderTreeNode(tree, assetUrl)}</div>
            </div>`
          : renderListView(listItems, assetUrl)
      }
    </section>
  `;
}

function renderTreeNode(node, assetUrl) {
  return `
    <div class="grid justify-items-center gap-3">
      <button
        type="button"
        class="grid w-24 justify-items-center gap-1 rounded border ${node.completed ? "border-accent bg-accent-soft" : "border-border bg-surface"} p-2 text-center"
        ${node.type === "material" ? "disabled" : ""}
        ${dataAttributes({ action: "toggleDivineBookTreeNode", nodeId: node.nodeId, completed: node.completed ? "true" : "false" })}
      >
        <span class="relative">
          <img class="size-10 rounded object-contain" src="${escapeHtml(assetUrl(node.icon))}" alt="" loading="lazy">
          ${node.completed ? `<span class="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-accent text-page">${Icon({ icon: Check, size: 12 })}</span>` : ""}
        </span>
        <span class="max-w-20 text-xs font-bold leading-tight">${escapeHtml(node.name)}</span>
        ${node.quantity > 1 ? `<span class="text-xs text-accent">${escapeHtml(node.quantity)}x</span>` : ""}
      </button>
      ${
        node.children?.length
          ? `<div class="flex items-start gap-3 border-t border-border pt-3">
              ${node.children.map((child) => renderTreeNode(child, assetUrl)).join("")}
            </div>`
          : ""
      }
    </div>
  `;
}

function renderListView(listItems, assetUrl) {
  return `
    <div class="grid gap-2">
      ${listItems.map((item) => `
        <div class="grid gap-3 rounded border border-border bg-surface-muted p-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div class="flex min-w-0 items-center gap-3">
            <img class="size-9 rounded object-contain" src="${escapeHtml(assetUrl(item.icon))}" alt="" loading="lazy">
            <div class="min-w-0">
              <p class="truncate font-bold">${escapeHtml(item.name)}</p>
              <p class="app-muted text-sm">${escapeHtml(t("divineBooks.list.requiredOwned", {
                required: item.requiredQuantity,
                owned: item.ownedQuantity
              }))}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="rounded border border-border bg-surface px-2 py-1 text-sm font-black ${item.missingQuantity > 0 ? "text-warning" : "text-success"}">
              ${escapeHtml(t("divineBooks.list.missing", { count: item.missingQuantity }))}
            </span>
            <button type="button" class="app-button app-button--sm app-button--secondary" aria-label="${escapeHtml(t("divineBooks.actions.removeOne", { name: item.name }))}" ${dataAttributes({ action: "decreaseOwned", itemId: item.itemId })}>
              <span class="app-button__icon">${Icon({ icon: Minus, size: 16 })}</span>
              <span class="app-sr-only">${escapeHtml(t("actions.remove"))}</span>
            </button>
            <button type="button" class="app-button app-button--sm app-button--secondary" aria-label="${escapeHtml(t("divineBooks.actions.addOne", { name: item.name }))}" ${dataAttributes({ action: "increaseOwned", itemId: item.itemId })}>
              <span class="app-button__icon">${Icon({ icon: Plus, size: 16 })}</span>
              <span class="app-sr-only">${escapeHtml(t("divineBooks.actions.addOne", { name: item.name }))}</span>
            </button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
