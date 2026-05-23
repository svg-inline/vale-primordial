import type { ReactNode } from "react";

interface EmptyFeatureProps {
  eyebrow: string;
  title: string;
  count: number;
  children: ReactNode;
}

export function EmptyFeature({ eyebrow, title, count, children }: EmptyFeatureProps) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <p className="app-muted text-sm font-bold uppercase">{eyebrow}</p>
        <h1 className="text-3xl font-black text-text">{title}</h1>
        <p className="app-muted text-sm">{count} registro(s) carregado(s).</p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-5">
        <div className="grid gap-2">
          <h2 className="text-lg font-extrabold text-text">Dados pendentes</h2>
          <div className="app-muted text-sm">{children}</div>
        </div>
      </section>
    </div>
  );
}
