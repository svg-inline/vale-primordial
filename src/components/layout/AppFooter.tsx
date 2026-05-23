"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { normalizePathname } from "./AppNav";

export function AppFooter() {
  const pathname = usePathname();
  const normalizedPathname = normalizePathname(pathname);
  const currentTitle =
    navItems.find((item) => item.href === normalizedPathname)?.label ?? "Inicio";

  return (
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
  );
}
