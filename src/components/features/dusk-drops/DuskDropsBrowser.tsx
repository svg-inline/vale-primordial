"use client";

import Image from "next/image";
import { Database, Layers, MoonStar, PackageSearch, Skull } from "lucide-react";
import { useMemo } from "react";
import { useDuskDropsQuery } from "@/hooks/useDuskDrops";
import { assetPath } from "@/lib/data/format";
import { filterDuskDrops } from "@/lib/queries/dusk-drops";
import { defaultDuskDropFilters, useDuskDropsStore } from "@/stores/dusk-drops.store";
import { useHydration } from "@/hooks/useHydration";
import { DuskDropFilters } from "./DuskDropFilters";
import { DuskDropTable } from "./DuskDropTable";
import type { DuskBoss, DuskDropsCatalog } from "@/types/dusk-drops";

interface DuskDropsBrowserProps {
  catalog: DuskDropsCatalog;
}

export function DuskDropsBrowser({ catalog }: DuskDropsBrowserProps) {
  const hydrated = useHydration();
  const { data: activeCatalog } = useDuskDropsQuery(catalog);
  const { filters, setFilters, resetFilters } = useDuskDropsStore();
  const activeFilters = hydrated ? filters : defaultDuskDropFilters;

  const filteredItems = useMemo(
    () => filterDuskDrops(activeCatalog, activeFilters),
    [activeCatalog, activeFilters],
  );

  const visibleBosses = useMemo(() => {
    const bossIds = new Set(filteredItems.map((item) => item.bossId).filter(Boolean));

    return activeCatalog.bosses
      .filter((boss) => bossIds.has(boss.id))
      .sort((left, right) => right.dropsCount - left.dropsCount || left.name.localeCompare(right.name))
      .slice(0, 6);
  }, [activeCatalog.bosses, filteredItems]);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="app-muted text-sm font-bold uppercase">Consulta</p>
        <div className="grid gap-2 md:flex md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-text">Drops Dusk</h1>
            <p className="app-muted mt-1 text-sm">
              {filteredItems.length} drops visiveis de {activeCatalog.items.length};{" "}
              {activeCatalog.bosses.length} bosses indexados.
            </p>
          </div>
          <a
            href={activeCatalog.meta.source}
            target="_blank"
            rel="noreferrer"
            className="app-button app-button--md app-button--secondary"
          >
            <Database size={16} aria-hidden />
            Fonte
          </a>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo Dusk">
        <StatCard icon={MoonStar} label="Dusks" value={activeCatalog.dusks.length} />
        <StatCard icon={Skull} label="Bosses" value={activeCatalog.bosses.length} />
        <StatCard icon={PackageSearch} label="Drops" value={activeCatalog.items.length} />
        <StatCard icon={Layers} label="Filtrados" value={filteredItems.length} />
      </section>

      <DuskDropFilters
        catalog={activeCatalog}
        filters={activeFilters}
        onChange={setFilters}
        onReset={resetFilters}
      />

      {visibleBosses.length > 0 ? (
        <section className="grid gap-3" aria-label="Bosses nos resultados">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-extrabold text-text">Bosses nos resultados</h2>
            <span className="app-muted text-sm">{visibleBosses.length} em destaque</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleBosses.map((boss) => (
              <li key={boss.id}>
                <BossCard boss={boss} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DuskDropTable catalog={activeCatalog} items={filteredItems} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MoonStar;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-md border border-border bg-surface-muted text-accent">
          <Icon size={18} aria-hidden />
        </span>
        <span className="text-2xl font-black text-text">{value}</span>
      </div>
      <p className="app-muted mt-3 text-xs font-bold uppercase">{label}</p>
    </article>
  );
}

function BossCard({ boss }: { boss: DuskBoss }) {
  return (
    <article className="grid min-h-full gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        {boss.image ? (
          <Image
            src={assetPath(boss.image)}
            alt=""
            width={56}
            height={56}
            style={{ width: "56px", height: "56px" }}
            className="rounded-md border border-border bg-surface-muted object-cover"
          />
        ) : (
          <span className="grid size-14 place-items-center rounded-md border border-border bg-surface-muted text-accent">
            <Skull size={20} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-extrabold text-text">{boss.name}</h3>
          <p className="app-muted text-xs font-bold uppercase">{boss.chapterName}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {boss.dusks.map((dusk) => (
          <span
            key={dusk}
            className="rounded border border-accent bg-accent-soft px-2 py-1 text-xs font-bold text-accent"
          >
            {dusk}
          </span>
        ))}
      </div>

      <p className="app-muted text-sm">
        {boss.dropsCount} drop(s) ligados; quantidade {boss.quantityOption || "nao informada"}.
      </p>
    </article>
  );
}
