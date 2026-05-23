"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AppNav } from "./AppNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { StylePresetSwitcher } from "./StylePresetSwitcher";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="border-b border-border bg-surface-muted">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-3 sm:px-6 md:grid-cols-[1fr_auto_auto] md:items-center lg:px-8">
          <p className="app-muted text-xs font-bold uppercase">
            PERFECT WORLD VALE PRIMORDIAL
          </p>
          <div className="md:w-48">
            <LanguageSwitcher />
          </div>
          <div className="md:w-56">
            <StylePresetSwitcher />
          </div>
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

          <AppNav />
        </div>
      </div>
    </header>
  );
}
