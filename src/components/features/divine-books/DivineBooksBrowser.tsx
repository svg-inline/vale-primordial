"use client";

import { Download, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createDivineBooksService } from "@/lib/calculators/divine-books";
import { useHydration } from "@/hooks/useHydration";
import { useDivineBooksStore } from "@/stores/divine-books.store";
import { DivineBookCard } from "./DivineBookCard";
import { DivineBookFilters } from "./DivineBookFilters";
import { DivineBookMaterialsSummary } from "./DivineBookMaterialsSummary";
import { DivineBookTreeView } from "./DivineBookTreeView";
import type {
  DivineBookCatalog,
  DivineBookListEntry,
  DivineBookMaterialsResult,
  DivineBookSummary,
  DivineBookTreeNode,
} from "@/types/divine-books";

interface DivineBooksBrowserProps {
  catalog: DivineBookCatalog;
}

export function DivineBooksBrowser({ catalog }: DivineBooksBrowserProps) {
  const hydrated = useHydration();
  const service = useMemo(() => createDivineBooksService(catalog) as any, [catalog]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [presetName, setPresetName] = useState("");
  const [importValue, setImportValue] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const {
    owned,
    treeProgressByRoot,
    recipePreferences,
    presets,
    filters,
    updateOwned,
    clearOwned,
    setTreeNodeProgress,
    resetTreeProgress,
    setRecipePreference,
    setFilters,
    savePreset,
    loadPreset,
    deletePreset,
    exportState,
    importState,
  } = useDivineBooksStore();

  const activeOwned = hydrated ? owned : {};
  const activeTreeProgressByRoot = hydrated ? treeProgressByRoot : {};
  const activeRecipePreferences = hydrated ? recipePreferences : {};

  const result = useMemo(
    () =>
      service.filterBooks({
        filters,
        owned: activeOwned,
        recipePreferences: activeRecipePreferences,
      }),
    [activeOwned, activeRecipePreferences, filters, service],
  ) as {
    books: DivineBookSummary[];
    stats: { totalBooks: number; ownedBooks: number; visibleBooks: number };
  };

  const targetBookId = selectedBookId || result.books[0]?.id || "";
  const selectedBook = useMemo(
    () =>
      targetBookId
        ? service.getItem({
            itemId: targetBookId,
            owned: activeOwned,
            recipePreferences: activeRecipePreferences,
          })
        : null,
    [activeOwned, activeRecipePreferences, service, targetBookId],
  ) as {
    item: DivineBookSummary | null;
    recipes: Array<{ id: string; resultItemId: string; materials: unknown[] }>;
    selectedRecipeId: string;
    warnings: string[];
  } | null;

  const rootItemId = selectedBook?.item?.id ?? "";
  const treeProgress = rootItemId ? activeTreeProgressByRoot[rootItemId] ?? {} : {};

  const materials = useMemo(() => {
    if (!rootItemId) {
      return null;
    }

    return service.calculateBaseMaterials({
      itemId: rootItemId,
      owned: activeOwned,
      treeProgress,
      recipePreferences: activeRecipePreferences,
    }) as DivineBookMaterialsResult;
  }, [activeOwned, activeRecipePreferences, rootItemId, service, treeProgress]);

  const tree = useMemo(() => {
    if (!rootItemId) {
      return null;
    }

    return service.buildTree({
      itemId: rootItemId,
      owned: activeOwned,
      treeProgress,
      recipePreferences: activeRecipePreferences,
    }).tree as DivineBookTreeNode | null;
  }, [activeOwned, activeRecipePreferences, rootItemId, service, treeProgress]);

  const listItems = useMemo(() => {
    if (!rootItemId) {
      return [];
    }

    return service.buildList({
      itemId: rootItemId,
      owned: activeOwned,
      treeProgress,
      recipePreferences: activeRecipePreferences,
    }).items as DivineBookListEntry[];
  }, [activeOwned, activeRecipePreferences, rootItemId, service, treeProgress]);

  const statOptions = useMemo(() => {
    const options = new Set<string>();

    for (const item of catalog.items) {
      for (const effect of item.effects ?? []) {
        const [stat] = effect.split(" ");

        if (stat) {
          options.add(stat);
        }
      }
    }

    return [...options].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [catalog.items]);

  function handleExport() {
    const payload = exportState();
    setImportValue(payload);
    void navigator.clipboard?.writeText(payload);
    setStatusMessage("Estado exportado.");
  }

  function handleImport() {
    const imported = importState(importValue);
    setStatusMessage(imported ? "Estado importado." : "Importacao invalida.");
  }

  function handleSavePreset() {
    savePreset(presetName);
    setStatusMessage(presetName.trim() ? "Preset salvo." : "Informe um nome.");
    setPresetName("");
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="app-muted text-sm font-bold uppercase">Calculadora</p>
        <div className="grid gap-2 md:flex md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text">Livros Divinos</h1>
            <p className="app-muted mt-1 text-sm">
              {result.stats.visibleBooks} visiveis de {result.stats.totalBooks};{" "}
              {result.stats.ownedBooks} obtidos.
            </p>
          </div>
          {Object.keys(activeOwned).length > 0 ? (
            <button
              type="button"
              onClick={clearOwned}
              className="app-button app-button--sm app-button--danger"
            >
              <X size={16} aria-hidden />
              Limpar inventario
            </button>
          ) : null}
        </div>
      </header>

      <DivineBookFilters
        filters={filters}
        tabs={catalog.tabs}
        statOptions={statOptions}
        onChange={setFilters}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-start">
        <section className="grid gap-3" aria-label="Resultado dos livros">
          {result.books.length === 0 ? (
            <p className="app-muted rounded-lg border border-border bg-surface p-4">
              Nenhum livro encontrado.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {result.books.map((book) => (
                <li key={book.id}>
                  <DivineBookCard
                    book={book}
                    active={rootItemId === book.id}
                    onSelect={() => setSelectedBookId(book.id)}
                    onIncrement={() => updateOwned(book.id, 1)}
                    onDecrement={() => updateOwned(book.id, -1)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="grid gap-4 xl:sticky xl:top-4" aria-label="Detalhes do livro">
          {selectedBook?.item ? (
            <>
              <DivineBookMaterialsSummary
                item={selectedBook.item}
                materials={materials}
                recipes={selectedBook.recipes}
                selectedRecipeId={selectedBook.selectedRecipeId}
                onRecipeChange={(recipeId) => setRecipePreference(selectedBook.item!.id, recipeId)}
              />
              <DivineBookTreeView
                rootItemId={selectedBook.item.id}
                tree={tree}
                listItems={listItems}
                progress={treeProgress}
                onToggleNode={(nodeId, value) =>
                  setTreeNodeProgress(selectedBook.item!.id, nodeId, value)
                }
                onReset={() => resetTreeProgress(selectedBook.item!.id)}
              />
              <section className="grid gap-3 rounded-lg border border-border bg-surface p-4">
                <h2 className="font-extrabold text-text">Presets</h2>
                <div className="grid gap-2">
                  <label className="app-field">
                    <span className="app-field__label">Nome</span>
                    <input
                      className="app-input"
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSavePreset}
                    className="app-button app-button--sm app-button--primary"
                  >
                    Salvar preset
                  </button>
                </div>

                {Object.keys(presets).length > 0 ? (
                  <ul className="grid gap-2">
                    {Object.keys(presets).map((name) => (
                      <li key={name} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadPreset(name)}
                          className="app-button app-button--sm app-button--secondary flex-1"
                        >
                          {name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePreset(name)}
                          className="app-button app-button--sm app-button--ghost"
                          aria-label={`Excluir preset ${name}`}
                        >
                          <X size={16} aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="grid gap-2">
                  <label className="app-field">
                    <span className="app-field__label">Importar ou exportar</span>
                    <textarea
                      className="app-input app-textarea"
                      value={importValue}
                      onChange={(event) => setImportValue(event.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="app-button app-button--sm app-button--secondary"
                    >
                      <Download size={16} aria-hidden />
                      Exportar
                    </button>
                    <button
                      type="button"
                      onClick={handleImport}
                      className="app-button app-button--sm app-button--secondary"
                    >
                      <Upload size={16} aria-hidden />
                      Importar
                    </button>
                  </div>
                  {statusMessage ? <p className="app-muted text-sm">{statusMessage}</p> : null}
                </div>
              </section>
            </>
          ) : (
            <p className="app-muted rounded-lg border border-border bg-surface p-4">
              Selecione um livro.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
