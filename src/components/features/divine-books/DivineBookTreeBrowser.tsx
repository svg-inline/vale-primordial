"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { createDivineBooksService } from "@/lib/calculators/divine-books";
import { useDivineBooksQuery } from "@/hooks/useDivineBooks";
import { useHydration } from "@/hooks/useHydration";
import { useDivineBooksStore } from "@/stores/divine-books.store";
import { DivineBookMaterialsSummary } from "./DivineBookMaterialsSummary";
import { DivineBookTreeView } from "./DivineBookTreeView";
import type {
  DivineBookCatalog,
  DivineBookListEntry,
  DivineBookMaterialsResult,
  DivineBookSummary,
  DivineBookTreeNode,
  DivineBooksItem,
} from "@/types/divine-books";

interface DivineBookTreeBrowserProps {
  catalog: DivineBookCatalog;
  initialBookId: string;
}

export function DivineBookTreeBrowser({ catalog, initialBookId }: DivineBookTreeBrowserProps) {
  const hydrated = useHydration();
  const { data: activeCatalog } = useDivineBooksQuery(catalog);
  const service = useMemo(() => createDivineBooksService(activeCatalog) as any, [activeCatalog]);
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);

  const {
    owned,
    treeProgressByRoot,
    recipePreferences,
    setTreeNodeProgress,
    resetTreeProgress,
    setRecipePreference,
  } = useDivineBooksStore();

  const activeOwned = hydrated ? owned : {};
  const activeTreeProgressByRoot = hydrated ? treeProgressByRoot : {};
  const activeRecipePreferences = hydrated ? recipePreferences : {};

  const books = useMemo(
    () =>
      activeCatalog.items.filter(
        (item): item is DivineBooksItem => item.type === "divine-book",
      ),
    [activeCatalog.items],
  );

  const targetBookId = books.some((book) => book.id === selectedBookId)
    ? selectedBookId
    : books[0]?.id ?? "";

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

  function handleBookChange(bookId: string) {
    setSelectedBookId(bookId);

    const url = new URL(window.location.href);
    url.searchParams.set("book", bookId);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-4">
        <Link href="/divine-books" className="app-button app-button--sm app-button--ghost w-fit">
          <ArrowLeft size={16} aria-hidden />
          Voltar para livros
        </Link>

        <div className="grid gap-3 md:flex md:items-end md:justify-between">
          <div>
            <p className="app-muted text-sm font-bold uppercase">Livros Divinos</p>
            <h1 className="text-3xl font-black text-text">Arvore de materiais</h1>
            <p className="app-muted mt-1 text-sm">
              Area dedicada para navegar arvores grandes sem limitar pelo painel lateral.
            </p>
          </div>
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-bold text-text">
            {Object.keys(treeProgress).length} ponto(s) marcados
          </p>
        </div>
      </header>

      <section className="grid gap-4 rounded-lg border border-border bg-surface p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <label className="app-field">
          <span className="app-field__label">Livro</span>
          <select
            value={targetBookId}
            onChange={(event) => handleBookChange(event.target.value)}
            className="app-input"
          >
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </label>

        {selectedBook?.item ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-text">
            <BookOpen size={16} aria-hidden />
            <span className="font-bold">Nivel {selectedBook.item.level ?? "-"}</span>
          </div>
        ) : null}
      </section>

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
        </>
      ) : (
        <p className="app-muted rounded-lg border border-border bg-surface p-4">
          Nenhum livro encontrado.
        </p>
      )}
    </div>
  );
}
