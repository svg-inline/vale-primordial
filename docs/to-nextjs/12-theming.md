# 12 — Temas e Style Presets

## Estratégia

Manter a mesma abordagem de CSS variables + `data-style-preset`, mas usar:

- `next-themes` para gerenciar o tema base (dark/light)
- Zustand para persistir o preset escolhido
- `useEffect` para aplicar o `data-style-preset` ao `<html>`

---

## Instalação

```bash
npm install next-themes
```

---

## `src/providers/ThemeProvider.tsx`

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";
import { useAppStore } from "@/stores/app.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-style-preset"
      defaultTheme="dark"
      enableSystem={false}
      themes={[
        "dark",
        "arcane",
        "classic",
        "high-contrast",
        "cupcake",
        "dracula",
        "light",
      ]}
    >
      <StylePresetSync />
      {children}
    </NextThemesProvider>
  );
}

// Componente interno que sincroniza Zustand ↔ next-themes
function StylePresetSync() {
  const stylePreset = useAppStore((s) => s.stylePreset);

  useEffect(() => {
    document.documentElement.dataset.stylePreset = stylePreset;
  }, [stylePreset]);

  return null;
}
```

---

## CSS Variables — `src/app/globals.css`

Copiar integralmente o conteúdo de `src/shared/styles/main.css` atual:

```css
@import "tailwindcss";

@theme inline {
  --font-sans:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;

  --color-page: var(--app-color-page);
  --color-surface: var(--app-color-surface);
  --color-surface-raised: var(--app-color-surface-raised);
  --color-surface-muted: var(--app-color-surface-muted);
  --color-text: var(--app-color-text);
  --color-text-muted: var(--app-color-text-muted);
  --color-accent: var(--app-color-accent);
  --color-accent-strong: var(--app-color-accent-strong);
  --color-accent-soft: var(--app-color-accent-soft);
  --color-border: var(--app-color-border);
  --color-danger: var(--app-color-danger);
  --color-warning: var(--app-color-warning);
  --color-success: var(--app-color-success);
  --shadow-panel: var(--app-shadow-panel);
  --radius-panel: var(--app-radius-panel);
}

/* dark (default) */
:root,
[data-style-preset="dark"] {
  color-scheme: dark;
  --app-color-page: #070a12;
  --app-color-surface: #101827;
  --app-color-surface-raised: #162033;
  --app-color-surface-muted: #0c1220;
  --app-color-text: #f8fafc;
  --app-color-text-muted: #a8b3c7;
  --app-color-accent: #38bdf8;
  --app-color-accent-strong: #0ea5e9;
  --app-color-accent-soft: rgba(56, 189, 248, 0.16);
  --app-color-border: #263244;
  --app-color-danger: #fb7185;
  --app-color-warning: #fbbf24;
  --app-color-success: #34d399;
  --app-shadow-panel: 0 18px 50px rgba(0, 0, 0, 0.32);
  --app-radius-panel: 0.5rem;
}

[data-style-preset="arcane"] {
  /* ... copiar do projeto atual ... */
}
[data-style-preset="classic"] {
  /* ... */
}
[data-style-preset="high-contrast"] {
  /* ... */
}
[data-style-preset="cupcake"] {
  /* ... */
}
[data-style-preset="dracula"] {
  /* ... */
}
[data-style-preset="light"] {
  /* ... */
}
```

---

## `src/stores/app.store.ts` (definido no 05)

O preset é salvo com Zustand persist. Consultar [05-state-management.md](./05-state-management.md).

---

## Componente StylePresetSwitcher

### `src/components/layout/StylePresetSwitcher.tsx`

```tsx
"use client";

import { ChevronDown, Palette } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/stores/app.store";

const presets = [
  { id: "dark", label: "Escuro" },
  { id: "arcane", label: "Arcano" },
  { id: "classic", label: "Clássico" },
  { id: "high-contrast", label: "Alto contraste" },
  { id: "cupcake", label: "Cupcake" },
  { id: "dracula", label: "Dracula" },
  { id: "light", label: "Claro" },
] as const;

type StylePreset = (typeof presets)[number]["id"];

export function StylePresetSwitcher() {
  const { stylePreset, setStylePreset } = useAppStore();
  const [open, setOpen] = useState(false);

  const active = presets.find((p) => p.id === stylePreset);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
      >
        <Palette size={14} aria-hidden />
        {active?.label ?? "Tema"}
        <ChevronDown size={14} aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Tema visual"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]"
        >
          {presets.map((preset) => (
            <li
              key={preset.id}
              role="option"
              aria-selected={preset.id === stylePreset}
            >
              <button
                type="button"
                onClick={() => {
                  setStylePreset(preset.id as StylePreset);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-raised)] ${
                  preset.id === stylePreset
                    ? "font-semibold text-[var(--color-accent)]"
                    : "text-[var(--color-text)]"
                }`}
              >
                {preset.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## Evitar flash de tema errado (FOUC)

No `app/layout.tsx`, usar `suppressHydrationWarning` no `<html>` e injetar um script inline que aplica o tema antes da renderização:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Script seguro: apenas lê localStorage e seta um data-attribute
            __html: `
              try {
                const stored = JSON.parse(localStorage.getItem('pw-helper:app:v1') || '{}');
                const preset = stored?.state?.stylePreset || 'dark';
                document.documentElement.dataset.stylePreset = preset;
              } catch {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

> O script inline é a única forma confiável de evitar FOUC com CSS variables e localStorage.
> Ele é mínimo, seguro (sem eval de input externo) e executa de forma síncrona antes da pintura.
