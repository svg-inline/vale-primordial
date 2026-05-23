"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Boxes, Gem, MoonStar, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const stylePresetStorageKey = "perfect-world-helper:style-preset";
const stylePresets = [
  { id: "dark", label: "Escuro" },
  { id: "arcane", label: "Arcano" },
  { id: "classic", label: "Classico" },
  { id: "high-contrast", label: "Alto contraste" },
  { id: "cupcake", label: "Cupcake" },
  { id: "dracula", label: "Dracula" },
  { id: "light", label: "Claro" },
];

const navItems = [
  { href: "/dusk", label: "Drops Dusk", icon: MoonStar },
  { href: "/equipments", label: "Equipamentos", icon: Boxes },
  { href: "/divine-books", label: "Livros Divinos", icon: BookOpen },
  { href: "/stones", label: "Pedras", icon: Gem },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [stylePreset, setStylePreset] = useState("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(stylePresetStorageKey);
    const nextPreset = stylePresets.some((preset) => preset.id === stored)
      ? stored ?? "dark"
      : "dark";

    setStylePreset(nextPreset);
    document.documentElement.dataset.stylePreset = nextPreset;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.stylePreset = stylePreset;
    window.localStorage.setItem(stylePresetStorageKey, stylePreset);
  }, [stylePreset]);

  const currentTitle = useMemo(() => {
    return navItems.find((item) => item.href === pathname)?.label ?? "Inicio";
  }, [pathname]);

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <header className="border-b border-border bg-surface">
        <div className="border-b border-border bg-surface-muted">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p className="app-muted text-xs font-bold uppercase">
              PERFECT WORLD VALE PRIMORDIAL
            </p>
            <label className="grid gap-1 text-sm font-semibold md:w-56">
              <span className="app-muted text-xs uppercase">Tema</span>
              <select
                value={stylePreset}
                onChange={(event) => setStylePreset(event.target.value)}
                className="app-input"
              >
                {stylePresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="PERFECT WORLD VALE PRIMORDIAL">
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent">
                <Sparkles size={20} aria-hidden />
              </span>
              <span className="grid">
                <span className="text-base font-black text-text">PERFECT WORLD VALE PRIMORDIAL</span>
                <span className="app-muted text-xs font-bold uppercase">Helper de jogo</span>
              </span>
            </Link>

            <nav className="flex flex-wrap gap-2" aria-label="Navegacao principal">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="app-button app-button--sm app-button--ghost"
                  >
                    <Icon size={16} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-border bg-surface-muted">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="app-muted">{currentTitle} | PERFECT WORLD VALE PRIMORDIAL</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 font-bold" aria-label="Links do rodape">
            {navItems.map((item) => (
              <Link key={item.href} className="text-text hover:text-accent" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
