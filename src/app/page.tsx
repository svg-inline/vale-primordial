import Link from "next/link";
import { BookOpen, Boxes, Gem, MoonStar } from "lucide-react";

const features = [
  {
    href: "/divine-books",
    title: "Livros Divinos",
    description: "Catalogo com filtros, inventario local e calculo de materiais.",
    icon: BookOpen,
  },
  {
    href: "/dusk",
    title: "Drops Dusk",
    description: "Consulta por dungeon, boss e item.",
    icon: MoonStar,
  },
  {
    href: "/equipments",
    title: "Equipamentos",
    description: "Selecao de equipamentos e materiais agregados.",
    icon: Boxes,
  },
  {
    href: "/stones",
    title: "Pedras",
    description: "Calculo de forja por nivel e quantidade.",
    icon: Gem,
  },
];

export default function HomePage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <p className="app-muted text-sm font-bold uppercase">Perfect World</p>
        <h1 className="max-w-3xl text-3xl font-black text-text sm:text-4xl">
          PERFECT WORLD VALE PRIMORDIAL
        </h1>
        <p className="app-muted max-w-2xl">
          Projeto migrado para Next.js com rotas reais, dados locais e base pronta para Supabase.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Ferramentas">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Link
              key={feature.href}
              href={feature.href}
              className="grid gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon size={20} aria-hidden />
              </span>
              <span className="grid gap-1">
                <span className="font-extrabold text-text">{feature.title}</span>
                <span className="app-muted text-sm">{feature.description}</span>
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
