"use client";

import type {
  DuskDropFilters as DuskDropFiltersType,
  DuskDropsCatalog,
} from "@/types/dusk-drops";
import { RotateCcw, Search } from "lucide-react";

interface DuskDropFiltersProps {
  catalog: DuskDropsCatalog;
  filters: DuskDropFiltersType;
  onChange: (filters: Partial<DuskDropFiltersType>) => void;
  onReset: () => void;
}

export function DuskDropFilters({
  catalog,
  filters,
  onChange,
  onReset,
}: DuskDropFiltersProps) {
  const dropTables = [...new Set(catalog.items.map((item) => item.dropTable))];
  const modes = [...new Set(catalog.items.flatMap((item) => item.modes))];

  return (
    <section
      className="grid gap-3 rounded-lg border border-border bg-surface p-4"
      aria-label="Filtros de Drops Dusk"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="app-field">
          <span className="app-field__label">Busca</span>
          <span className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              name="dusk-drop-query"
              type="search"
              value={filters.query}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="Item, boss, Dusk ou modo"
              className="app-input pl-9"
            />
          </span>
        </label>

        <label className="app-field">
          <span className="app-field__label">Capitulo</span>
          <select
            name="dusk-drop-chapter"
            value={filters.chapter}
            onChange={(event) => onChange({ chapter: event.target.value })}
            className="app-input"
          >
            <option value="all">Todos</option>
            {catalog.chapters.map((chapter) => (
              <option
                key={chapter.id}
                value={chapter.id.replace("chapter-", "")}
              >
                {chapter.name}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span className="app-field__label">Dusk</span>
          <select
            name="dusk-drop-dusk"
            value={filters.dusk}
            onChange={(event) => onChange({ dusk: event.target.value })}
            className="app-input"
          >
            <option value="all">Todas</option>
            {catalog.dusks.map((dusk) => (
              <option key={dusk.id} value={dusk.id}>
                {dusk.label}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span className="app-field__label">Boss</span>
          <select
            name="dusk-drop-boss"
            value={filters.boss}
            onChange={(event) => onChange({ boss: event.target.value })}
            className="app-input"
          >
            <option value="all">Todos</option>
            {catalog.bosses.map((boss) => (
              <option key={boss.id} value={boss.id}>
                {boss.name}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span className="app-field__label">Modo</span>
          <select
            name="dusk-drop-mode"
            value={filters.mode}
            onChange={(event) => onChange({ mode: event.target.value })}
            className="app-input"
          >
            <option value="all">Todos</option>
            {modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span className="app-field__label">Tabela</span>
          <select
            name="dusk-drop-table"
            value={filters.dropTable}
            onChange={(event) => onChange({ dropTable: event.target.value })}
            className="app-input"
          >
            <option value="all">Todas</option>
            {dropTables.map((dropTable) => (
              <option key={dropTable} value={dropTable}>
                {dropTable}
              </option>
            ))}
          </select>
        </label>

        <label className="app-field">
          <span className="app-field__label">Ordenar</span>
          <select
            name="dusk-drop-sort"
            value={filters.sort}
            onChange={(event) =>
              onChange({
                sort: event.target.value as DuskDropFiltersType["sort"],
              })
            }
            className="app-input"
          >
            <option value="name">Nome</option>
            <option value="dusk">Dusk</option>
            <option value="boss">Boss</option>
            <option value="table">Tabela</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="app-button app-button--md app-button--secondary w-full"
          >
            <RotateCcw size={16} aria-hidden />
            Limpar
          </button>
        </div>
      </div>
    </section>
  );
}
