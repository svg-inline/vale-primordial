import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";

export function Tabs({
  id,
  tabs = [],
  activeId,
  action = "selectTab",
  className = "",
  attrs = {}
} = {}) {
  const selectedId = activeId ?? tabs[0]?.id;
  const activeTab = tabs.find((tab) => tab.id === selectedId) ?? tabs[0];

  return `
    <div class="${classNames("app-tabs", className)}" ${attributes(attrs)}>
      <div class="app-tabs__list" role="tablist" aria-label="${escapeHtml(id)}">
        ${tabs.map((tab) => TabButton({ tab, tabsId: id, selected: tab.id === activeTab?.id, action })).join("")}
      </div>
      <section
        id="${escapeHtml(id)}-${escapeHtml(activeTab?.id ?? "panel")}-panel"
        class="app-tabs__panel"
        role="tabpanel"
        aria-labelledby="${escapeHtml(id)}-${escapeHtml(activeTab?.id ?? "tab")}-tab"
      >
        ${activeTab?.content ?? ""}
      </section>
    </div>
  `;
}

function TabButton({ tab, tabsId, selected, action }) {
  return `
    <button
      id="${escapeHtml(tabsId)}-${escapeHtml(tab.id)}-tab"
      type="button"
      class="app-tabs__tab"
      role="tab"
      aria-selected="${selected ? "true" : "false"}"
      aria-controls="${escapeHtml(tabsId)}-${escapeHtml(tab.id)}-panel"
      tabindex="${selected ? "0" : "-1"}"
      ${dataAttributes({ action, tabsId, tabId: tab.id })}
    >
      ${escapeHtml(tab.label)}
    </button>
  `;
}
