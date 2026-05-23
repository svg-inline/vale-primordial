"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { isAppLocale } from "@/stores/app.store";

export function AppNav() {
  const pathname = usePathname();
  const normalizedPathname = normalizePathname(pathname);

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Navegacao principal">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = normalizedPathname === item.href;

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
  );
}

export function normalizePathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] && isAppLocale(segments[0])) {
    return `/${segments.slice(1).join("/")}` || "/";
  }

  return pathname || "/";
}
