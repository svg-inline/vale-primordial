"use client";

import Image from "next/image";
import { Check, Minus, Plus } from "lucide-react";
import { assetPath } from "@/lib/data/format";
import type { DivineBookSummary } from "@/types/divine-books";

interface DivineBookCardProps {
  book: DivineBookSummary;
  active: boolean;
  onSelect: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function DivineBookCard({
  book,
  active,
  onSelect,
  onIncrement,
  onDecrement,
}: DivineBookCardProps) {
  const isOwned = book.ownedQuantity > 0;

  return (
    <article
      className={`grid gap-3 rounded-lg border bg-surface p-4 ${
        active ? "border-accent" : "border-border"
      }`}
    >
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
          <span className="app-muted mt-1 block text-xs font-bold uppercase">
            Nivel {book.level ?? "-"}
          </span>
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
          <span
            key={effect}
            className="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-accent"
          >
            {effect}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="app-muted text-xs font-bold">{book.recipeCount} receita(s)</span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onDecrement}
            className="app-button app-button--sm app-button--secondary"
            aria-label={`Remover ${book.name}`}
          >
            <Minus size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onIncrement}
            className="app-button app-button--sm app-button--primary"
            aria-label={`Adicionar ${book.name}`}
          >
            <Plus size={16} aria-hidden />
          </button>
        </span>
      </div>
    </article>
  );
}
