"use client";

import { Search } from "lucide-react";
import type { DivineBookFilters as DivineBookFiltersType, DivineBooksTab } from "@/types/divine-books";

interface DivineBookFiltersProps {
  filters: DivineBookFiltersType;
  tabs: DivineBooksTab[];
  statOptions: string[];
  onChange: (filters: Partial<DivineBookFiltersType>) => void;
}

export function DivineBookFilters({
  filters,
  tabs,
  statOptions,
  onChange,
}: DivineBookFiltersProps) {
  return (
    <section
      className="grid gap-3 rounded-lg border border-border bg-surface p-4"
      aria-label="Filtros de livros divinos"
    >
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
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="Livro, efeito ou material"
              className="app-input pl-9"
            />
          </span>
        </label>

        <label className="app-field">
          <span className="app-field__label">Aba</span>
          <select
            value={filters.tabId}
            onChange={(event) => onChange({ tabId: event.target.value })}
            className="app-input"
          >
            <option value="all">Todas</option>
            {tabs.map((tab) => (
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
            onChange={(event) => onChange({ stat: event.target.value })}
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
            onChange={(event) =>
              onChange({ ownedMode: event.target.value as DivineBookFiltersType["ownedMode"] })
            }
            className="app-input"
          >
            <option value="all">Todos</option>
            <option value="owned">Obtidos</option>
            <option value="missing">Faltando</option>
          </select>
        </label>
      </div>
    </section>
  );
}
