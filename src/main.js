import ListFilter from "lucide/dist/esm/icons/list-filter.mjs";
import Search from "lucide/dist/esm/icons/search.mjs";
import Sparkles from "lucide/dist/esm/icons/sparkles.mjs";
import Trash2 from "lucide/dist/esm/icons/trash-2.mjs";
import "./styles/main.css";
import "./libs/litedom.js";
import { Button, Dropdown, Icon, Input, LinkButton, Modal, Select, Switch, Tabs, Textarea, Toggle } from "./components/ui/index.js";
import { changeLanguage, getLanguage, initI18n, supportedLanguages, t } from "./i18n/index.js";
import { defaultStylePreset, isStylePreset, stylePresets } from "./styles/style-presets.js";
import { escapeHtml } from "./utils/escape-html.js";

const { component, useState } = globalThis;
const tx = (key, options) => escapeHtml(t(key, options));
const stylePresetStorageKey = "perfect-world-helper:style-preset";

bootstrap();

async function bootstrap() {
  await initI18n();

  applyStylePreset(readStoredStylePreset());
  syncDocumentMetadata();

  component("#app", renderApp);
}

function renderApp() {
  const [language, setLanguage] = useState(getLanguage());
  const [activeStylePreset, setActiveStylePreset] = useState(readCurrentStylePreset());
  const [languageSelectOpen, setLanguageSelectOpen] = useState(false);
  const [stylePresetSelectOpen, setStylePresetSelectOpen] = useState(false);
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
    document.querySelector("[data-action='toggleLanguageSelect']")?.addEventListener("click", () => {
      setLanguageSelectOpen(!languageSelectOpen);
      setStylePresetSelectOpen(false);
      setSelectOpen(false);
    }, { once: true });
    document.querySelectorAll("[data-action='selectLanguage']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextLanguage = element.dataset.value ?? "";

        if (!supportedLanguages.includes(nextLanguage)) {
          return;
        }

        await changeLanguage(nextLanguage);
        syncDocumentMetadata();
        setLanguage(getLanguage());
        setLanguageSelectOpen(false);
      }, { once: true });
    });
    document.querySelector("[data-action='toggleStylePresetSelect']")?.addEventListener("click", () => {
      setStylePresetSelectOpen(!stylePresetSelectOpen);
      setLanguageSelectOpen(false);
      setSelectOpen(false);
    }, { once: true });
    document.querySelectorAll("[data-action='selectStylePreset']").forEach((element) => {
      element.addEventListener("click", () => {
        const nextStylePreset = element.dataset.value ?? "";

        if (!isStylePreset(nextStylePreset)) {
          return;
        }

        applyStylePreset(nextStylePreset);
        setActiveStylePreset(nextStylePreset);
        setStylePresetSelectOpen(false);
      }, { once: true });
    });
    document.querySelector("[data-action='openModal']")?.addEventListener("click", () => setModalOpen(true), { once: true });
    document.querySelectorAll("[data-action='closeModal']").forEach((element) => {
      element.addEventListener("click", () => setModalOpen(false), { once: true });
    });
    document.querySelector("[data-action='toggleDropdown']")?.addEventListener("click", () => setDropdownOpen(!dropdownOpen), { once: true });
    document.querySelector("[data-action='toggleSelect']")?.addEventListener("click", () => {
      setSelectOpen(!selectOpen);
      setLanguageSelectOpen(false);
      setStylePresetSelectOpen(false);
    }, { once: true });
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
    <div class="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <header class="border-b border-border bg-surface/80 backdrop-blur">
        <div class="border-b border-border/70 bg-surface-muted/70">
          <div class="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p class="app-muted text-xs font-bold uppercase tracking-[0.14em]">${tx("topbar.label")}</p>
            <div class="grid w-full gap-3 sm:grid-cols-2 md:w-auto md:min-w-[26rem]">
              ${Select({
                id: "language-select",
                label: t("preferences.language"),
                value: language,
                open: languageSelectOpen,
                action: "toggleLanguageSelect",
                optionAction: "selectLanguage",
                options: supportedLanguages.map((value) => ({
                  value,
                  label: t(`languages.${value}`)
                }))
              })}
              ${Select({
                id: "style-preset-select",
                label: t("preferences.stylePreset"),
                value: activeStylePreset,
                open: stylePresetSelectOpen,
                action: "toggleStylePresetSelect",
                optionAction: "selectStylePreset",
                options: stylePresets.map((preset) => ({
                  value: preset.id,
                  label: t(preset.labelKey)
                }))
              })}
            </div>
          </div>
        </div>

        <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <a href="#/" class="flex items-center gap-3" aria-label="${tx("app.name")}">
              <span class="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                ${Icon({ icon: Sparkles, size: 20 })}
              </span>
              <span class="grid">
                <span class="text-base font-black text-text">${tx("app.name")}</span>
                <span class="app-muted text-xs font-bold uppercase tracking-[0.14em]">${tx("app.tagline")}</span>
              </span>
            </a>

            <nav class="flex flex-wrap gap-2" aria-label="${tx("nav.primary")}">
              ${LinkButton({ label: t("nav.home"), href: "#/", current: true })}
              ${LinkButton({ label: t("nav.dusk"), href: "#/dusk" })}
              ${LinkButton({ label: t("nav.equipments"), href: "#/equipments" })}
              ${LinkButton({ label: t("nav.divineBooks"), href: "#/divine-books" })}
              ${LinkButton({ label: t("nav.stones"), href: "#/stones" })}
            </nav>
          </div>
        </div>
      </header>

      <main class="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section class="grid gap-3">
          <p class="app-muted text-sm font-bold uppercase tracking-[0.14em]">${tx("home.eyebrow")}</p>
          <div>
            <h1 class="text-3xl font-black text-text sm:text-4xl">${tx("home.title")}</h1>
            <p class="app-muted mt-2 max-w-2xl">
              ${tx("home.description")}
            </p>
          </div>
        </section>

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

      <footer class="border-t border-border bg-surface-muted">
        <div class="mx-auto grid w-full max-w-6xl gap-3 px-4 py-6 text-sm sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <p class="app-muted">${tx("footer.description")}</p>
          <nav class="flex flex-wrap gap-x-4 gap-y-2 font-bold" aria-label="${tx("footer.navigation")}">
            <a class="text-text hover:text-accent" href="#/dusk">${tx("nav.dusk")}</a>
            <a class="text-text hover:text-accent" href="#/equipments">${tx("nav.equipments")}</a>
            <a class="text-text hover:text-accent" href="#/divine-books">${tx("nav.divineBooks")}</a>
            <a class="text-text hover:text-accent" href="#/stones">${tx("nav.stones")}</a>
          </nav>
        </div>
      </footer>
    </div>
  `;
}

function syncDocumentMetadata() {
  document.title = t("app.name");
  document.querySelector("meta[name='description']")?.setAttribute("content", t("meta.description"));
}

function readStoredStylePreset() {
  try {
    const storedStylePreset = localStorage.getItem(stylePresetStorageKey);

    return isStylePreset(storedStylePreset) ? storedStylePreset : defaultStylePreset;
  } catch {
    return defaultStylePreset;
  }
}

function readCurrentStylePreset() {
  const currentStylePreset = document.documentElement.dataset.stylePreset;

  return isStylePreset(currentStylePreset) ? currentStylePreset : defaultStylePreset;
}

function applyStylePreset(stylePreset) {
  const nextStylePreset = isStylePreset(stylePreset) ? stylePreset : defaultStylePreset;

  document.documentElement.dataset.stylePreset = nextStylePreset;

  try {
    localStorage.setItem(stylePresetStorageKey, nextStylePreset);
  } catch {
    // Local preferences can fail in restricted browser contexts.
  }
}
