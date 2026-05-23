import Download from "lucide/dist/esm/icons/download.mjs";
import Minus from "lucide/dist/esm/icons/minus.mjs";
import Plus from "lucide/dist/esm/icons/plus.mjs";
import Upload from "lucide/dist/esm/icons/upload.mjs";
import { Button, Icon, Modal } from "../../../shared/components/ui/index.js";
import { sendFeatureMessage } from "../../../shared/worker/worker-client.js";
import { t } from "../../../shared/i18n/index.js";
import { escapeHtml } from "../../../shared/utils/escape-html.js";
import { dataAttributes } from "../../../shared/utils/html.js";
import { DivineBookCard } from "../components/DivineBookCard.js";
import { DivineBookFilters } from "../components/DivineBookFilters.js";
import { DivineBookMaterialsSummary } from "../components/DivineBookMaterialsSummary.js";
import { DivineBookTreeView } from "../components/DivineBookTreeView.js";
import {
  deletePreset,
  exportDivineBooksState,
  importDivineBooksState,
  loadPreset,
  readDivineBooksState,
  resetTreeProgress,
  savePreset,
  setRecipePreference,
  setTreeNodeProgress,
  updateOwnedQuantity,
  writeDivineBooksState
} from "../stores/divine-books.store.js";

export function DivineBooksPage() {
  const { useState } = globalThis;
  const [catalog, setCatalog] = useState({ status: "idle", tabs: [], books: [], materials: [], stats: {} });
  const [state, setState] = useState(null);
  const [filterResult, setFilterResult] = useState({ books: [], stats: {} });
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [treeResult, setTreeResult] = useState({ tree: null });
  const [listResult, setListResult] = useState({ items: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [treeRootItemId, setTreeRootItemId] = useState("");
  const [treeMode, setTreeMode] = useState("tree");
  const [statSelectOpen, setStatSelectOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [message, setMessage] = useState("");

  const assetUrl = (value = "") => {
    const base = import.meta.env.BASE_URL || "./";
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;

    return value ? `${normalizedBase}${value}` : "";
  };

  if (catalog.status === "idle") {
    queueMicrotask(async () => {
      setCatalog({ ...catalog, status: "loading" });

      try {
        const initialState = await sendFeatureMessage({
          feature: "divineBooks",
          action: "GET_INITIAL_STATE"
        });
        const storedState = readDivineBooksState(initialState);
        const filtered = await filterBooks(storedState);

        setState(storedState);
        setCatalog({ ...initialState, status: "ready" });
        setFilterResult(filtered);
      } catch (error) {
        setCatalog({ ...catalog, status: "error" });
        setMessage(error instanceof Error ? error.message : t("divineBooks.errors.load"));
      }
    });
  }

  queueMicrotask(() => bindEvents());

  async function filterBooks(nextState) {
    return sendFeatureMessage({
      feature: "divineBooks",
      action: "FILTER",
      payload: {
        filters: nextState.filters,
        owned: nextState.owned,
        recipePreferences: nextState.recipePreferences
      }
    });
  }

  async function refreshFilteredBooks(nextState = state) {
    if (!nextState) {
      return;
    }

    setFilterResult(await filterBooks(nextState));
  }

  async function openBook(itemId, nextState = state) {
    if (!nextState) {
      return;
    }

    const [detail, nextCalculation] = await Promise.all([
      sendFeatureMessage({
        feature: "divineBooks",
        action: "GET_ITEM",
        payload: {
          itemId,
          owned: nextState.owned,
          recipePreferences: nextState.recipePreferences
        }
      }),
      sendFeatureMessage({
        feature: "divineBooks",
        action: "CALCULATE_BASE_MATERIALS",
        payload: {
          itemId,
          owned: nextState.owned,
          treeProgress: nextState.treeProgressByRoot[itemId] ?? {},
          recipePreferences: nextState.recipePreferences
        }
      })
    ]);

    setSelectedDetail(detail);
    setCalculation(nextCalculation);
    setTreeRootItemId(itemId);
    setModalOpen(true);
    await refreshTree(itemId, nextState);
  }

  async function refreshTree(itemId = treeRootItemId, nextState = state) {
    if (!itemId || !nextState) {
      return;
    }

    const payload = {
      itemId,
      owned: nextState.owned,
      treeProgress: nextState.treeProgressByRoot[itemId] ?? {},
      recipePreferences: nextState.recipePreferences
    };
    const [nextTree, nextList] = await Promise.all([
      sendFeatureMessage({ feature: "divineBooks", action: "BUILD_TREE", payload }),
      sendFeatureMessage({ feature: "divineBooks", action: "BUILD_LIST", payload })
    ]);

    setTreeResult(nextTree);
    setListResult(nextList);
  }

  function persist(nextState) {
    const storedState = writeDivineBooksState(nextState);

    setState(storedState);

    return storedState;
  }

  function bindEvents() {
    document.querySelector("[data-action='changeDivineBookQuery']")?.addEventListener("input", async (event) => {
      const nextState = persist({
        ...state,
        filters: {
          ...state.filters,
          query: event.target.value
        }
      });

      await refreshFilteredBooks(nextState);
    }, { once: true });

    document.querySelector("[data-action='toggleDivineBookStatSelect']")?.addEventListener("click", () => {
      setStatSelectOpen(!statSelectOpen);
    }, { once: true });

    document.querySelectorAll("[data-action='selectDivineBookStat']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = persist({
          ...state,
          filters: {
            ...state.filters,
            stat: element.dataset.value ?? ""
          }
        });

        setStatSelectOpen(false);
        await refreshFilteredBooks(nextState);
      }, { once: true });
    });

    document.querySelectorAll("[data-action='selectDivineBookTab']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = persist({
          ...state,
          filters: {
            ...state.filters,
            tabId: element.dataset.tabId ?? "all"
          }
        });

        await refreshFilteredBooks(nextState);
      }, { once: true });
    });

    document.querySelectorAll("[data-action='selectDivineBookOwnedMode']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = persist({
          ...state,
          filters: {
            ...state.filters,
            ownedMode: element.dataset.value ?? "all"
          }
        });

        await refreshFilteredBooks(nextState);
      }, { once: true });
    });

    document.querySelector("[data-action='clearDivineBookFilters']")?.addEventListener("click", async () => {
      const nextState = persist({
        ...state,
        filters: {
          tabId: "all",
          query: "",
          stat: "",
          ownedMode: "all"
        }
      });

      await refreshFilteredBooks(nextState);
    }, { once: true });

    document.querySelectorAll("[data-action='openDivineBook']").forEach((element) => {
      element.addEventListener("click", () => openBook(element.dataset.itemId), { once: true });
    });

    document.querySelectorAll("[data-action='increaseOwned']").forEach((element) => {
      element.addEventListener("click", async (event) => {
        event.stopPropagation();
        const nextState = updateOwnedQuantity(state, element.dataset.itemId, 1);

        setState(nextState);
        await refreshFilteredBooks(nextState);
        await refreshSelectedViews(nextState);
      }, { once: true });
    });

    document.querySelectorAll("[data-action='decreaseOwned']").forEach((element) => {
      element.addEventListener("click", async (event) => {
        event.stopPropagation();
        const nextState = updateOwnedQuantity(state, element.dataset.itemId, -1);

        setState(nextState);
        await refreshFilteredBooks(nextState);
        await refreshSelectedViews(nextState);
      }, { once: true });
    });

    document.querySelectorAll("[data-action='closeModal']").forEach((element) => {
      element.addEventListener("click", () => setModalOpen(false), { once: true });
    });

    document.querySelectorAll("[data-action='selectDivineBookRecipe']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = setRecipePreference(state, element.dataset.itemId, element.dataset.recipeId);

        setState(nextState);
        await openBook(element.dataset.itemId, nextState);
        setMessage(t("divineBooks.messages.recipeSelected"));
      }, { once: true });
    });

    document.querySelectorAll("[data-action='toggleDivineBookTreeNode']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = setTreeNodeProgress(
          state,
          treeRootItemId,
          element.dataset.nodeId,
          element.dataset.completed !== "true"
        );

        setState(nextState);
        await refreshSelectedViews(nextState);
      }, { once: true });
    });

    document.querySelectorAll("[data-action='setDivineBookTreeMode']").forEach((element) => {
      element.addEventListener("click", () => setTreeMode(element.dataset.value ?? "tree"), { once: true });
    });

    document.querySelector("[data-action='resetDivineBookTree']")?.addEventListener("click", async () => {
      const nextState = resetTreeProgress(state, treeRootItemId);

      setState(nextState);
      await refreshSelectedViews(nextState);
      setMessage(t("divineBooks.messages.treeReset"));
    }, { once: true });

    document.querySelector("[data-action='changeDivineBookPresetName']")?.addEventListener("input", (event) => {
      setPresetName(event.target.value);
    }, { once: true });

    document.querySelector("[data-action='saveDivineBookPreset']")?.addEventListener("click", () => {
      const nextState = savePreset(state, presetName);

      setPresetName("");
      setState(nextState);
      setMessage(t("divineBooks.messages.presetSaved"));
    }, { once: true });

    document.querySelectorAll("[data-action='loadDivineBookPreset']").forEach((element) => {
      element.addEventListener("click", async () => {
        const nextState = loadPreset(state, element.dataset.name ?? "");

        setState(nextState);
        await refreshFilteredBooks(nextState);
        await refreshSelectedViews(nextState);
        setMessage(t("divineBooks.messages.presetLoaded"));
      }, { once: true });
    });

    document.querySelectorAll("[data-action='deleteDivineBookPreset']").forEach((element) => {
      element.addEventListener("click", () => {
        const nextState = deletePreset(state, element.dataset.name ?? "");

        setState(nextState);
        setMessage(t("divineBooks.messages.presetDeleted"));
      }, { once: true });
    });

    document.querySelector("[data-action='exportDivineBookState']")?.addEventListener("click", async () => {
      const encodedState = exportDivineBooksState(state);

      await navigator.clipboard?.writeText(encodedState);
      setMessage(t("divineBooks.messages.exported"));
    }, { once: true });

    document.querySelector("[data-action='importDivineBookState']")?.addEventListener("click", async () => {
      const encodedState = window.prompt(t("divineBooks.import.prompt"));

      if (!encodedState) {
        return;
      }

      try {
        const nextState = importDivineBooksState(encodedState);

        setState(nextState);
        await refreshFilteredBooks(nextState);
        await refreshSelectedViews(nextState);
        setMessage(t("divineBooks.messages.imported"));
      } catch {
        setMessage(t("divineBooks.errors.invalidImport"));
      }
    }, { once: true });
  }

  async function refreshSelectedViews(nextState) {
    if (selectedDetail?.item?.id) {
      const nextCalculation = await sendFeatureMessage({
        feature: "divineBooks",
        action: "CALCULATE_BASE_MATERIALS",
        payload: {
          itemId: selectedDetail.item.id,
          owned: nextState.owned,
          treeProgress: nextState.treeProgressByRoot[selectedDetail.item.id] ?? {},
          recipePreferences: nextState.recipePreferences
        }
      });

      setCalculation(nextCalculation);
      await refreshTree(selectedDetail.item.id, nextState);
    }
  }

  return `
    <section class="grid gap-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="app-muted text-sm font-bold uppercase tracking-[0.14em]">${escapeHtml(t("features.divineBooks.eyebrow"))}</p>
          <h1 class="mt-2 text-3xl font-black text-text sm:text-4xl">${escapeHtml(t("nav.divineBooks"))}</h1>
          <p class="app-muted mt-2 max-w-2xl">${escapeHtml(t("features.divineBooks.description"))}</p>
        </div>
        <div class="app-surface flex flex-wrap gap-3 p-3">
          <span class="grid min-w-24 gap-1 text-center">
            <span class="text-xl font-black text-accent">${escapeHtml(catalog.stats?.totalBooks ?? 0)}</span>
            <span class="app-muted text-xs font-bold uppercase">${escapeHtml(t("divineBooks.stats.books"))}</span>
          </span>
          <span class="grid min-w-24 gap-1 text-center">
            <span class="text-xl font-black text-accent">${escapeHtml(catalog.stats?.totalRecipes ?? 0)}</span>
            <span class="app-muted text-xs font-bold uppercase">${escapeHtml(t("divineBooks.stats.recipes"))}</span>
          </span>
        </div>
      </div>

      ${message ? `<p class="rounded border border-border bg-surface-muted p-3 text-sm text-accent" aria-live="polite">${escapeHtml(message)}</p>` : ""}

      ${renderContent()}
      ${renderDetailModal()}
    </section>
  `;

  function renderContent() {
    if (catalog.status === "loading" || catalog.status === "idle" || !state) {
      return `<div class="app-surface p-6 text-center app-muted">${escapeHtml(t("divineBooks.loading"))}</div>`;
    }

    if (catalog.status === "error") {
      return `<div class="app-surface p-6 text-center text-danger">${escapeHtml(t("divineBooks.errors.load"))}</div>`;
    }

    return `
      <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div class="grid gap-4">
          ${DivineBookFilters({
            tabs: catalog.tabs,
            filters: state.filters,
            stats: filterResult.stats,
            statSelectOpen
          })}
          ${renderInventoryPanel()}
          ${renderPresetPanel()}
        </div>
        <section class="grid gap-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-extrabold">${escapeHtml(t("divineBooks.results.title"))}</h2>
            <span class="app-muted text-sm">${escapeHtml(t("divineBooks.results.count", { count: filterResult.books.length }))}</span>
          </div>
          ${
            filterResult.books.length
              ? `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  ${filterResult.books.map((book) => DivineBookCard({ book, assetUrl })).join("")}
                </div>`
              : `<div class="app-surface p-8 text-center app-muted">${escapeHtml(t("divineBooks.empty"))}</div>`
          }
        </section>
      </div>
    `;
  }

  function renderInventoryPanel() {
    const ownedEntries = Object.entries(state.owned)
      .map(([itemId, quantity]) => ({
        item: [...catalog.books, ...catalog.materials].find((entry) => entry.id === itemId),
        quantity
      }))
      .filter((entry) => entry.item)
      .sort((a, b) => a.item.name.localeCompare(b.item.name, "pt-BR"));

    return `
      <section class="app-surface grid gap-3 p-4">
        <h2 class="font-extrabold">${escapeHtml(t("divineBooks.inventory.title"))}</h2>
        ${
          ownedEntries.length
            ? `<div class="grid max-h-72 gap-2 overflow-auto pr-1">
                ${ownedEntries.map(({ item, quantity }) => `
                  <div class="flex items-center gap-2 rounded border border-border bg-surface-muted p-2">
                    <img class="size-7 rounded object-contain" src="${escapeHtml(assetUrl(item.icon))}" alt="" loading="lazy">
                    <span class="min-w-0 flex-1 truncate text-sm font-bold">${escapeHtml(item.name)}</span>
                    <span class="text-sm text-accent">${escapeHtml(quantity)}x</span>
                    <button type="button" class="app-button app-button--sm app-button--ghost" aria-label="${escapeHtml(t("divineBooks.actions.removeOne", { name: item.name }))}" ${dataAttributes({ action: "decreaseOwned", itemId: item.id })}>
                      <span class="app-button__icon">${ButtonIcon(Minus)}</span>
                      <span class="app-sr-only">${escapeHtml(t("actions.remove"))}</span>
                    </button>
                  </div>
                `).join("")}
              </div>`
            : `<p class="app-muted text-sm">${escapeHtml(t("divineBooks.inventory.empty"))}</p>`
        }
      </section>
    `;
  }

  function renderPresetPanel() {
    const presetNames = Object.keys(state.presets ?? {}).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return `
      <section class="app-surface grid gap-3 p-4">
        <h2 class="font-extrabold">${escapeHtml(t("divineBooks.presets.title"))}</h2>
        <div class="flex gap-2">
          <input class="app-input min-w-0" value="${escapeHtml(presetName)}" placeholder="${escapeHtml(t("divineBooks.presets.placeholder"))}" ${dataAttributes({ action: "changeDivineBookPresetName" })}>
          ${Button({ label: t("divineBooks.presets.save"), variant: "primary", action: "saveDivineBookPreset" })}
        </div>
        ${
          presetNames.length
            ? `<div class="grid gap-2">
                ${presetNames.map((name) => `
                  <div class="flex items-center gap-2 rounded border border-border bg-surface-muted p-2">
                    <button type="button" class="min-w-0 flex-1 truncate text-left text-sm font-bold hover:text-accent" ${dataAttributes({ action: "loadDivineBookPreset", name })}>${escapeHtml(name)}</button>
                    ${Button({ label: t("actions.remove"), variant: "ghost", size: "sm", action: "deleteDivineBookPreset", data: { name } })}
                  </div>
                `).join("")}
              </div>`
            : `<p class="app-muted text-sm">${escapeHtml(t("divineBooks.presets.empty"))}</p>`
        }
        <div class="grid gap-2 sm:grid-cols-2">
          ${Button({ label: t("divineBooks.import.export"), variant: "secondary", icon: Download, action: "exportDivineBookState" })}
          ${Button({ label: t("divineBooks.import.import"), variant: "secondary", icon: Upload, action: "importDivineBookState" })}
        </div>
      </section>
    `;
  }

  function renderDetailModal() {
    const item = selectedDetail?.item;

    if (!item) {
      return "";
    }

    const selectedRecipe = selectedDetail.recipes.find((recipe) => recipe.id === selectedDetail.selectedRecipeId) ?? selectedDetail.recipes[0];
    const selectedRecipeMaterials = selectedRecipe?.materials ?? [];

    return Modal({
      id: "divine-book-detail-modal",
      title: item.name,
      description: t("divineBooks.level", { level: item.level ?? "-" }),
      size: "lg",
      open: modalOpen,
      closeLabel: t("actions.close"),
      body: `
        <div class="grid gap-5">
          <div class="grid gap-4 sm:grid-cols-[auto_1fr]">
            <img class="size-20 rounded-lg border border-border bg-surface-muted object-contain p-2" src="${escapeHtml(assetUrl(item.icon))}" alt="" loading="lazy">
            <div class="grid gap-3">
              <div class="flex flex-wrap gap-2">
                ${(item.effects ?? []).map((effect) => `<span class="rounded border border-border bg-surface-muted px-2 py-1 text-sm text-accent">${escapeHtml(effect)}</span>`).join("")}
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="app-button app-button--sm app-button--secondary" ${dataAttributes({ action: "decreaseOwned", itemId: item.id })}>
                  <span class="app-button__icon">${ButtonIcon(Minus)}</span>
                  <span>${escapeHtml(t("divineBooks.actions.removeOwned"))}</span>
                </button>
                <button type="button" class="app-button app-button--sm app-button--primary" ${dataAttributes({ action: "increaseOwned", itemId: item.id })}>
                  <span class="app-button__icon">${ButtonIcon(Plus)}</span>
                  <span>${escapeHtml(t("divineBooks.actions.markOwned"))}</span>
                </button>
              </div>
            </div>
          </div>

          ${renderRecipeChooser(item, selectedDetail.recipes, selectedDetail.selectedRecipeId)}

          <section class="grid gap-2">
            <h3 class="font-extrabold">${escapeHtml(t("divineBooks.recipes.materials"))}</h3>
            ${
              selectedRecipeMaterials.length
                ? `<div class="grid gap-2 sm:grid-cols-2">
                    ${selectedRecipeMaterials.map((material) => {
                      const materialItem = [...catalog.books, ...catalog.materials].find((entry) => entry.id === material.itemId);

                      return `
                        <div class="flex items-center gap-3 rounded border border-border bg-surface-muted p-2">
                          <img class="size-8 rounded object-contain" src="${escapeHtml(assetUrl(materialItem?.icon ?? ""))}" alt="" loading="lazy">
                          <span class="min-w-0 flex-1 truncate text-sm font-bold">${escapeHtml(materialItem?.name ?? material.itemId)}</span>
                          <span class="rounded bg-accent-soft px-2 py-1 text-sm font-black text-accent">${escapeHtml(material.quantity)}x</span>
                        </div>
                      `;
                    }).join("")}
                  </div>`
                : `<p class="app-muted text-sm">${escapeHtml(t("divineBooks.recipes.noMaterials"))}</p>`
            }
          </section>

          ${DivineBookMaterialsSummary({
            materials: calculation?.missing ?? [],
            progressPercent: calculation?.progressPercent ?? 0,
            assetUrl
          })}

          ${DivineBookTreeView({
            rootItemId: item.id,
            tree: treeResult.tree,
            listItems: listResult.items,
            viewMode: treeMode,
            assetUrl
          })}
        </div>
      `
    });
  }

  function renderRecipeChooser(item, recipes, selectedRecipeId) {
    if (!recipes?.length) {
      return "";
    }

    return `
      <section class="grid gap-2">
        <h3 class="font-extrabold">${escapeHtml(t("divineBooks.recipes.title"))}</h3>
        <div class="flex flex-wrap gap-2">
          ${recipes.map((recipe, index) => `
            <button
              type="button"
              class="app-toggle ${recipe.id === selectedRecipeId ? "app-toggle--pressed" : ""}"
              aria-pressed="${recipe.id === selectedRecipeId ? "true" : "false"}"
              ${dataAttributes({ action: "selectDivineBookRecipe", itemId: item.id, recipeId: recipe.id })}
            >${escapeHtml(t("divineBooks.recipes.option", { number: index + 1 }))}</button>
          `).join("")}
        </div>
      </section>
    `;
  }
}

function ButtonIcon(icon) {
  return Icon({ icon, size: 16 });
}
