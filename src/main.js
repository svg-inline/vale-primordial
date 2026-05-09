import ListFilter from "lucide/dist/esm/icons/list-filter.mjs";
import Search from "lucide/dist/esm/icons/search.mjs";
import Trash2 from "lucide/dist/esm/icons/trash-2.mjs";
import "./styles/main.css";
import "./libs/litedom.js";
import { Button, Dropdown, Input, LinkButton, Modal, Select, Switch, Tabs, Textarea, Toggle } from "./components/ui/index.js";
import { initI18n, t } from "./i18n/index.js";
import { escapeHtml } from "./utils/escape-html.js";

const { component, useState } = globalThis;
const tx = (key, options) => escapeHtml(t(key, options));

bootstrap();

async function bootstrap() {
  await initI18n();

  document.title = t("app.name");
  document.querySelector("meta[name='description']")?.setAttribute("content", t("meta.description"));

  component("#app", renderApp);
}

function renderApp() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [activeTab, setActiveTab] = useState("filters");

  const equipmentOptions = [
    { value: "weapon", label: t("equipment.types.weapon") },
    { value: "armor", label: t("equipment.types.armor") },
    { value: "ornament", label: t("equipment.types.ornament") }
  ];

  queueMicrotask(() => {
    document.querySelector("[data-action='openModal']")?.addEventListener("click", () => setModalOpen(true), { once: true });
    document.querySelectorAll("[data-action='closeModal']").forEach((element) => {
      element.addEventListener("click", () => setModalOpen(false), { once: true });
    });
    document.querySelector("[data-action='toggleDropdown']")?.addEventListener("click", () => setDropdownOpen(!dropdownOpen), { once: true });
    document.querySelector("[data-action='toggleSelect']")?.addEventListener("click", () => setSelectOpen(!selectOpen), { once: true });
    document.querySelectorAll("[data-action='selectEquipmentType']").forEach((element) => {
      element.addEventListener("click", () => {
        setEquipmentType(element.dataset.value ?? "");
        setSelectOpen(false);
      }, { once: true });
    });
    document.querySelector("[data-action='toggleFavorites']")?.addEventListener("click", () => setOnlyFavorites(!onlyFavorites), { once: true });
    document.querySelector("[data-action='toggleCompactMode']")?.addEventListener("click", () => setCompactMode(!compactMode), { once: true });
    document.querySelectorAll("[data-action='selectComponentTab']").forEach((element) => {
      element.addEventListener("click", () => setActiveTab(element.dataset.tabId ?? "filters"), { once: true });
    });
  });

  return `
    <main class="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-3">
        <p class="app-muted text-sm font-bold uppercase tracking-[0.14em]">${tx("app.name")}</p>
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="text-3xl font-black text-text sm:text-4xl">${tx("home.title")}</h1>
            <p class="app-muted mt-2 max-w-2xl">
              ${tx("home.description")}
            </p>
          </div>
          <nav class="flex flex-wrap gap-2" aria-label="${tx("nav.example")}">
            ${LinkButton({ label: t("nav.home"), href: "#/", current: true })}
            ${LinkButton({ label: t("nav.dusk"), href: "#/dusk" })}
            ${LinkButton({ label: t("nav.stones"), href: "#/stones" })}
          </nav>
        </div>
      </header>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">${tx("sections.buttons.title")}</h2>
          <p class="app-muted mt-1 text-sm">${tx("sections.buttons.description")}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          ${Button({ label: t("actions.search"), variant: "primary", icon: Search })}
          ${Button({ label: t("actions.filter"), variant: "secondary", icon: ListFilter })}
          ${Button({ label: t("actions.clear"), variant: "ghost" })}
          ${Button({ label: t("actions.remove"), variant: "danger", icon: Trash2 })}
          ${Button({ label: t("actions.disabled"), disabled: true })}
        </div>
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">${tx("sections.inputs.title")}</h2>
          <p class="app-muted mt-1 text-sm">${tx("sections.inputs.description")}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          ${Input({
            id: "search",
            label: t("fields.search.label"),
            placeholder: t("search.placeholder"),
            hint: t("search.hint")
          })}
          ${Select({
            id: "equipment-type",
            label: t("filters.equipmentType"),
            placeholder: t("filters.allEquipmentTypes"),
            value: equipmentType,
            open: selectOpen,
            action: "toggleSelect",
            optionAction: "selectEquipmentType",
            options: equipmentOptions
          })}
          ${Input({
            id: "quantity",
            label: t("fields.quantity.label"),
            type: "number",
            value: "1",
            required: true,
            attrs: { min: 1 }
          })}
          ${Input({
            id: "invalid-example",
            label: t("fields.invalidExample.label"),
            value: "0",
            error: t("fields.invalidExample.error")
          })}
          <div class="md:col-span-2">
            ${Textarea({
              id: "notes",
              label: t("fields.notes.label"),
              placeholder: t("fields.notes.placeholder")
            })}
          </div>
        </div>
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">${tx("sections.toggles.title")}</h2>
          <p class="app-muted mt-1 text-sm">${tx("sections.toggles.description")}</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          ${Toggle({
            id: "favorites-toggle",
            label: t("preferences.onlyFavorites"),
            pressed: onlyFavorites,
            action: "toggleFavorites"
          })}
          ${Switch({
            id: "compact-mode-switch",
            label: t("preferences.compactMode"),
            description: t("preferences.compactMode.description"),
            checked: compactMode,
            action: "toggleCompactMode"
          })}
        </div>
        ${Tabs({
          id: "component-tabs",
          activeId: activeTab,
          action: "selectComponentTab",
          tabs: [
            {
              id: "filters",
              label: t("tabs.filters"),
              content: `<p class="app-muted">${tx("tabs.filters.description")}</p>`
            },
            {
              id: "results",
              label: t("tabs.results"),
              content: `<p class="app-muted">${tx("tabs.results.description")}</p>`
            },
            {
              id: "history",
              label: t("tabs.history"),
              content: `<p class="app-muted">${tx("tabs.history.description")}</p>`
            }
          ]
        })}
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">${tx("sections.menus.title")}</h2>
          <p class="app-muted mt-1 text-sm">${tx("sections.menus.description")}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          ${Dropdown({
            id: "actions-menu",
            label: t("actions.menu"),
            open: dropdownOpen,
            items: [
              { label: t("actions.saveFilter"), action: "saveFilter" },
              { label: t("actions.exportList"), action: "exportList" },
              { label: t("actions.deletePreset"), action: "deletePreset", danger: true }
            ]
          })}
          ${Button({ label: t("actions.openModal"), variant: "primary", action: "openModal" })}
        </div>
      </section>

      ${Modal({
        id: "example-modal",
        title: t("modal.confirmCalculation.title"),
        description: t("modal.confirmCalculation.description"),
        closeLabel: t("actions.close"),
        open: modalOpen,
        body: `
          <p class="app-muted">
            ${tx("modal.confirmCalculation.body")}
          </p>
        `,
        actions: [
          { label: t("actions.cancel"), variant: "ghost", action: "closeModal", data: { modalId: "example-modal" } },
          { label: t("actions.confirm"), variant: "primary", action: "closeModal", data: { modalId: "example-modal" } }
        ]
      })}
    </main>
  `;
}
