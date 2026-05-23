"use client";

import Image from "next/image";
import { assetPath } from "@/lib/data/format";
import type {
  DivineBookMaterialsResult,
  DivineBooksItem,
} from "@/types/divine-books";

interface DivineBookMaterialsSummaryProps {
  item: DivineBooksItem;
  materials: DivineBookMaterialsResult | null;
  recipes: Array<{ id: string }>;
  selectedRecipeId: string;
  onRecipeChange: (recipeId: string) => void;
}

export function DivineBookMaterialsSummary({
  item,
  materials,
  recipes,
  selectedRecipeId,
  onRecipeChange,
}: DivineBookMaterialsSummaryProps) {
  const missing = materials?.missing ?? [];
  const required = materials?.required ?? [];
  const progress = materials?.progressPercent ?? 0;

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
            <p className="app-muted text-sm">Progresso: {progress}%</p>
          </div>
        </div>

        {recipes.length > 1 ? (
          <label className="app-field">
            <span className="app-field__label">Receita</span>
            <select
              value={selectedRecipeId}
              onChange={(event) => onRecipeChange(event.target.value)}
              className="app-input"
            >
              {recipes.map((recipe, index) => (
                <option key={recipe.id} value={recipe.id}>
                  Receita {index + 1}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>

      <div className="grid gap-4 p-4">
        <div className="grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="block h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="app-muted text-xs">
            {required.length} material(is) base, {missing.length} ainda faltando.
          </p>
        </div>

        <MaterialList title="Materiais faltantes" emptyLabel="Tudo coberto." entries={missing} />
      </div>
    </section>
  );
}

function MaterialList({
  title,
  emptyLabel,
  entries,
}: {
  title: string;
  emptyLabel: string;
  entries: DivineBookMaterialsResult["missing"];
}) {
  return (
    <div className="grid gap-3">
      <h3 className="text-sm font-bold uppercase text-text">{title}</h3>
      {entries.length === 0 ? (
        <p className="app-muted text-sm">{emptyLabel}</p>
      ) : (
        <ul className="grid gap-2">
          {entries.map((entry) => {
            const name = entry.item?.name ?? entry.itemId;
            const icon = entry.item?.icon ?? "";

            return (
              <li
                key={entry.itemId}
                className="flex items-center gap-3 rounded border border-border bg-surface-muted px-3 py-2"
              >
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
  );
}
