"use client";

import Image from "next/image";
import { Box, Skull } from "lucide-react";
import { assetPath } from "@/lib/data/format";
import type { DuskBoss, DuskDropItem, DuskDropsCatalog } from "@/types/dusk-drops";

interface DuskDropTableProps {
  catalog: DuskDropsCatalog;
  items: DuskDropItem[];
}

export function DuskDropTable({ catalog, items }: DuskDropTableProps) {
  if (items.length === 0) {
    return (
      <p className="app-muted rounded-lg border border-border bg-surface p-4">
        Nenhum drop encontrado.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-lg font-extrabold text-text">Drops indexados</h2>
        <p className="app-muted text-sm">{items.length} resultado(s)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[56rem] w-full border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-extrabold">
                Item
              </th>
              <th scope="col" className="px-4 py-3 font-extrabold">
                Dropado de
              </th>
              <th scope="col" className="px-4 py-3 font-extrabold">
                Dusk
              </th>
              <th scope="col" className="px-4 py-3 font-extrabold">
                Modo
              </th>
              <th scope="col" className="px-4 py-3 font-extrabold">
                Tabela
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const boss = item.bossId ? catalog.indexes.bossById[item.bossId] : null;

              return (
                <tr key={item.id} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-semibold text-text">
                    <span className="flex min-w-0 items-center gap-3">
                      <Image
                        src={assetPath(item.image)}
                        alt=""
                        width={42}
                        height={42}
                        style={{ width: "42px", height: "42px" }}
                        className="rounded-md border border-border bg-surface-muted object-contain p-1"
                      />
                      <span className="min-w-0">
                        <span className="block leading-tight">{item.name}</span>
                        <span className="app-muted mt-1 block text-xs font-bold uppercase">
                          {item.id}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-4 py-3">
                    <SourceCell item={item} boss={boss} />
                  </td>
                  <td className="px-4 py-3">
                    <TagList values={item.dusks} tone="primary" />
                  </td>
                  <td className="px-4 py-3">
                    <TagList values={item.modes} tone="blue" />
                  </td>
                  <td className="px-4 py-3 text-text">{item.dropTable}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceCell({ item, boss }: { item: DuskDropItem; boss: DuskBoss | null }) {
  if (!boss) {
    return (
      <span className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-border bg-surface-muted text-text-muted">
          <Box size={18} aria-hidden />
        </span>
        <span>
          <span className="block font-semibold text-text">{item.droppedBy}</span>
          <span className="app-muted text-xs font-bold uppercase">Ambiente</span>
        </span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-3">
      {boss.image ? (
        <Image
          src={assetPath(boss.image)}
          alt=""
          width={42}
          height={42}
          style={{ width: "42px", height: "42px" }}
          className="rounded-md border border-border bg-surface-muted object-cover"
        />
      ) : (
        <span className="grid size-10 place-items-center rounded-md border border-border bg-surface-muted text-accent">
          <Skull size={18} aria-hidden />
        </span>
      )}
      <span>
        <span className="block font-semibold text-text">{boss.name}</span>
        <span className="app-muted text-xs font-bold uppercase">{boss.chapterName}</span>
      </span>
    </span>
  );
}

function TagList({ values, tone }: { values: string[]; tone: "primary" | "blue" }) {
  const className =
    tone === "primary"
      ? "border-accent bg-accent-soft text-accent"
      : "border-border bg-surface-muted text-text";

  return (
    <span className="flex flex-wrap gap-1">
      {values.map((value) => (
        <span key={value} className={`rounded border px-2 py-1 text-xs font-bold ${className}`}>
          {value}
        </span>
      ))}
    </span>
  );
}
