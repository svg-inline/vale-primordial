"use client";

import Image from "next/image";
import { Check, Minus, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createDivineBooksService, defaultFilters } from "@/lib/calculators/divine-books";
import { assetPath, normalizeText } from "@/lib/data/format";
import type {
  DivineBookCatalog,
  DivineBookFilters,
  DivineBookSummary,
  DivineBooksItem,
} from "@/types/divine-books";

const ownedStorageKey = "perfect-world-helper:divine-books:owned";

interface DivineBooksBrowserProps {
  catalog: DivineBookCatalog;
}

type OwnedMap = Record<string, number>;

export function DivineBooksBrowser({ catalog }: DivineBooksBrowserProps) {
  const service = useMemo(() => createDivineBooksService(catalog) as any, [catalog]);
  const [filters, setFilters] = useState<DivineBookFilters>(defaultFilters as DivineBookFilters);
  const [owned, setOwned] = useState<OwnedMap>({});
  const [selectedBookId, setSelectedBookId] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(ownedStorageKey);

    if (!raw) {
      return;
    }

    try {
      setOwned(JSON.parse(raw) as OwnedMap);
    } catch {
      window.localStorage.removeItem(ownedStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ownedStorageKey, JSON.stringify(owned));
  }, [owned]);

  const result = useMemo(
    () => service.filterBooks({ filters, owned }),
    [filters, owned, service],
  ) as { books: DivineBookSummary[]; stats: { totalBooks: number; ownedBooks: number; visibleBooks: number } };

  const selectedBook = useMemo(() => {
    const targetId = selectedBookId || result.books[0]?.id || "";

    return targetId ? service.getItem({ itemId: targetId, owned }) : null;
  }, [owned, result.books, selectedBookId, service]);

  const materials = useMemo(() => {
    const targetId = selectedBook?.item?.id ?? "";

    if (!targetId) {
      return null;
    }

    return service.calculateBaseMaterials({ itemId: targetId, owned });
  }, [owned, selectedBook?.item?.id, service]);

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

  function updateFilter(nextFilters: Partial<DivineBookFilters>) {
    setFilters((current) => ({ ...current, ...nextFilters }));
  }

  function updateOwned(itemId: string, delta: number) {
    setOwned((current) => {
      const quantity = Math.max((current[itemId] ?? 0) + delta, 0);
      const next = { ...current };

      if (quantity === 0) {
        delete next[itemId];
      } else {
        next[itemId] = quantity;
      }

      return next;
    });
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="app-muted text-sm font-bold uppercase">Calculadora</p>
        <div className="grid gap-2 md:flex md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text">Livros Divinos</h1>
            <p className="app-muted mt-1 text-sm">
              {result.stats.visibleBooks} visiveis de {result.stats.totalBooks}; {result.stats.ownedBooks} obtidos.
            </p>
          </div>
          {Object.keys(owned).length > 0 ? (
            <button
              type="button"
              onClick={() => setOwned({})}
              className="app-button app-button--sm app-button--danger"
            >
              <X size={16} aria-hidden />
              Limpar inventario
            </button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-3 rounded-lg border border-border bg-surface p-4" aria-label="Filtros de livros divinos">
        <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_12rem]">
          <label className="app-field">
            <span className="app-field__label">Busca</span>
            <span className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter({ query: event.target.value })}
                placeholder="Livro, efeito ou material"
                className="app-input pl-9"
              />
            </span>
          </label>

          <label className="app-field">
            <span className="app-field__label">Aba</span>
            <select
              value={filters.tabId}
              onChange={(event) => updateFilter({ tabId: event.target.value })}
              className="app-input"
            >
              <option value="all">Todas</option>
              {catalog.tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </label>

          <label className="app-field">
            <span className="app-field__label">Atributo</span>
            <select
              value={filters.stat}
              onChange={(event) => updateFilter({ stat: event.target.value })}
              className="app-input"
            >
              <option value="">Todos</option>
              {statOptions.map((stat) => (
                <option key={stat} value={stat}>
                  {stat}
                </option>
              ))}
            </select>
          </label>

          <label className="app-field">
            <span className="app-field__label">Situacao</span>
            <select
              value={filters.ownedMode}
              onChange={(event) => updateFilter({ ownedMode: event.target.value as DivineBookFilters["ownedMode"] })}
              className="app-input"
            >
              <option value="all">Todos</option>
              <option value="owned">Obtidos</option>
              <option value="missing">Faltando</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
        <section className="grid gap-3" aria-label="Resultado dos livros">
          {result.books.length === 0 ? (
            <p className="app-muted rounded-lg border border-border bg-surface p-4">Nenhum livro encontrado.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {result.books.map((book) => (
                <li key={book.id}>
                  <DivineBookCard
                    book={book}
                    active={selectedBook?.item?.id === book.id}
                    onSelect={() => setSelectedBookId(book.id)}
                    onIncrement={() => updateOwned(book.id, 1)}
                    onDecrement={() => updateOwned(book.id, -1)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="grid gap-3 lg:sticky lg:top-4" aria-label="Detalhes do livro">
          {selectedBook?.item ? (
            <BookDetails item={selectedBook.item} materials={materials} />
          ) : (
            <p className="app-muted rounded-lg border border-border bg-surface p-4">Selecione um livro.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

interface DivineBookCardProps {
  book: DivineBookSummary;
  active: boolean;
  onSelect: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function DivineBookCard({ book, active, onSelect, onIncrement, onDecrement }: DivineBookCardProps) {
  const isOwned = book.ownedQuantity > 0;

  return (
    <article className={`grid gap-3 rounded-lg border bg-surface p-4 ${active ? "border-accent" : "border-border"}`}>
      <button type="button" onClick={onSelect} className="flex gap-3 text-left">
        {book.icon ? (
          <Image
            src={assetPath(book.icon)}
            alt=""
            width={48}
            height={48}
            style={{ width: "48px", height: "48px" }}
            className="rounded-md border border-border bg-surface-muted object-contain p-1"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block font-extrabold leading-tight text-text">{book.name}</span>
          <span className="app-muted mt-1 block text-xs font-bold uppercase">Nivel {book.level ?? "-"}</span>
        </span>
        {isOwned ? (
          <span className="inline-flex items-center gap-1 self-start rounded border border-accent bg-accent-soft px-2 py-1 text-xs font-bold text-accent">
            <Check size={14} aria-hidden />
            {book.ownedQuantity}
          </span>
        ) : null}
      </button>

      <div className="flex flex-wrap gap-1">
        {book.effects.map((effect) => (
          <span key={effect} className="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-accent">
            {effect}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="app-muted text-xs font-bold">{book.recipeCount} receita(s)</span>
        <span className="flex gap-2">
          <button type="button" onClick={onDecrement} className="app-button app-button--sm app-button--secondary" aria-label={`Remover ${book.name}`}>
            <Minus size={16} aria-hidden />
          </button>
          <button type="button" onClick={onIncrement} className="app-button app-button--sm app-button--primary" aria-label={`Adicionar ${book.name}`}>
            <Plus size={16} aria-hidden />
          </button>
        </span>
      </div>
    </article>
  );
}

function BookDetails({
  item,
  materials,
}: {
  item: DivineBooksItem;
  materials: { missing: Array<{ itemId: string; quantity: number; item: DivineBooksItem | null }>; progressPercent: number } | null;
}) {
  const missing = materials?.missing ?? [];

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <header className="grid gap-3 border-b border-border bg-surface-muted p-4">
        <div className="flex items-center gap-3">
          {item.icon ? (
            <Image
              src={assetPath(item.icon)}
              alt=""
              width={44}
              height={44}
              style={{ width: "44px", height: "44px" }}
              className="rounded-md border border-border object-contain p-1"
            />
          ) : null}
          <div>
            <h2 className="font-extrabold text-text">{item.name}</h2>
            <p className="app-muted text-sm">Progresso: {materials?.progressPercent ?? 0}%</p>
          </div>
        </div>
      </header>
      <div className="grid gap-3 p-4">
        <h3 className="text-sm font-bold uppercase text-text">Materiais faltantes</h3>
        {missing.length === 0 ? (
          <p className="app-muted text-sm">Tudo coberto pelo inventario.</p>
        ) : (
          <ul className="grid gap-2">
            {missing.map((entry) => {
              const name = entry.item?.name ?? entry.itemId;
              const icon = entry.item?.icon ?? "";

              return (
                <li key={entry.itemId} className="flex items-center gap-3 rounded border border-border bg-surface-muted px-3 py-2">
                  {icon ? (
                    <Image
                      src={assetPath(icon)}
                      alt=""
                      width={28}
                      height={28}
                      style={{ width: "28px", height: "28px" }}
                      className="rounded object-contain"
                    />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{name}</span>
                  <span className="text-sm font-black text-accent">x{entry.quantity}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
