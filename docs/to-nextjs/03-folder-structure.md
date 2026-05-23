# 03 — Estrutura de Pastas

## Estrutura completa

```
perfect-world-helper/
├─ public/
│  └─ assets/
│     ├─ divine-books/          ← imagens de livros divinos (copiadas do projeto atual)
│     ├─ items/                 ← ícones de itens
│     └─ dusk/                  ← imagens de dungeons
│
├─ src/
│  ├─ app/                      ← Next.js App Router
│  │  ├─ layout.tsx             ← RootLayout (providers, nav, footer)
│  │  ├─ page.tsx               ← HomePage
│  │  ├─ globals.css            ← Tailwind + CSS variables (temas)
│  │  ├─ not-found.tsx
│  │  │
│  │  ├─ divine-books/
│  │  │  ├─ page.tsx            ← Server Component (fetch inicial)
│  │  │  └─ [id]/
│  │  │     └─ page.tsx         ← Detalhe de livro (opcional)
│  │  │
│  │  ├─ dusk/
│  │  │  └─ page.tsx
│  │  │
│  │  ├─ equipments/
│  │  │  └─ page.tsx
│  │  │
│  │  └─ stones/
│  │     └─ page.tsx
│  │
│  ├─ components/
│  │  ├─ ui/                    ← Componentes base (equivale a shared/components/ui/)
│  │  │  ├─ Button.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Select.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Tabs.tsx
│  │  │  ├─ Toggle.tsx
│  │  │  ├─ Switch.tsx
│  │  │  ├─ Dropdown.tsx
│  │  │  ├─ Textarea.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ layout/                ← Componentes estruturais
│  │  │  ├─ AppNav.tsx
│  │  │  ├─ AppHeader.tsx
│  │  │  ├─ AppFooter.tsx
│  │  │  └─ TopBar.tsx
│  │  │
│  │  └─ features/             ← Componentes por feature
│  │     ├─ divine-books/
│  │     │  ├─ DivineBooksBrowser.tsx     ← Client Component principal
│  │     │  ├─ DivineBookCard.tsx
│  │     │  ├─ DivineBookFilters.tsx
│  │     │  ├─ DivineBookMaterialsSummary.tsx
│  │     │  └─ DivineBookTreeView.tsx
│  │     ├─ dusk-drops/
│  │     │  ├─ DuskDropsBrowser.tsx
│  │     │  ├─ DuskDropFilters.tsx
│  │     │  └─ DuskDropTable.tsx
│  │     ├─ equipments/
│  │     │  ├─ EquipmentsBrowser.tsx
│  │     │  ├─ EquipmentFilters.tsx
│  │     │  └─ EquipmentMaterialsList.tsx
│  │     └─ stones/
│  │        ├─ StonesCalculator.tsx
│  │        └─ StoneResult.tsx
│  │
│  ├─ hooks/                    ← Custom hooks (TanStack Query wrappers)
│  │  ├─ useDivineBooks.ts
│  │  ├─ useDuskDrops.ts
│  │  ├─ useEquipments.ts
│  │  └─ useStones.ts
│  │
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts           ← Browser client (singleton)
│  │  │  ├─ server.ts           ← Server client (RSC, Server Actions)
│  │  │  └─ types.ts            ← Tipos gerados pelo Supabase CLI
│  │  │
│  │  ├─ queries/               ← Funções de query do Supabase
│  │  │  ├─ divine-books.ts
│  │  │  ├─ dusk-drops.ts
│  │  │  ├─ equipments.ts
│  │  │  └─ stones.ts
│  │  │
│  │  └─ calculators/           ← Calculadoras puras (migradas do Worker)
│  │     ├─ divine-books.ts     ← createDivineBooksService migrado
│  │     ├─ stones.ts
│  │     ├─ equipments.ts
│  │     └─ dusk.ts
│  │
│  ├─ stores/                   ← Zustand stores
│  │  ├─ app.store.ts           ← tema, idioma
│  │  ├─ divine-books.store.ts  ← owned, filters, presets, treeProgress
│  │  ├─ dusk-drops.store.ts
│  │  ├─ equipments.store.ts
│  │  └─ stones.store.ts
│  │
│  ├─ i18n/                     ← next-intl
│  │  ├─ request.ts             ← config de locale por request
│  │  ├─ routing.ts             ← defineRouting
│  │  └─ locales/
│  │     ├─ pt-BR.json
│  │     ├─ en-US.json
│  │     └─ es-ES.json
│  │
│  ├─ types/                    ← Tipos TypeScript globais
│  │  ├─ divine-books.ts
│  │  ├─ dusk-drops.ts
│  │  ├─ equipments.ts
│  │  └─ stones.ts
│  │
│  └─ providers/
│     ├─ QueryProvider.tsx      ← TanStack Query Provider
│     └─ ThemeProvider.tsx      ← next-themes provider
│
├─ supabase/
│  ├─ config.toml
│  └─ migrations/
│     ├─ 001_create_items.sql
│     ├─ 002_create_recipes.sql
│     ├─ 003_create_dusk_drops.sql
│     ├─ 004_create_equipments.sql
│     └─ 005_create_stones.sql
│
├─ tests/
│  ├─ calculators/
│  │  ├─ divine-books.test.ts
│  │  ├─ stones.test.ts
│  │  └─ equipments.test.ts
│  └─ queries/
│     └─ divine-books.test.ts
│
├─ .env.local
├─ next.config.ts
├─ tailwind.config.ts          ← só se precisar de config adicional no v4
├─ vitest.config.ts
└─ package.json
```

---

## Mapeamento de responsabilidades

| Diretório              | Responsabilidade                                   |
| ---------------------- | -------------------------------------------------- |
| `app/`                 | Roteamento, metadata, layouts, fetch inicial (RSC) |
| `components/ui/`       | Primitivos visuais reutilizáveis                   |
| `components/layout/`   | Estrutura da página (nav, header, footer)          |
| `components/features/` | Componentes específicos de cada feature            |
| `hooks/`               | TanStack Query wrappers e hooks de estado          |
| `lib/supabase/`        | Clientes do Supabase (server e browser)            |
| `lib/queries/`         | Funções que consultam o Supabase                   |
| `lib/calculators/`     | Lógica pura (migrada do Worker)                    |
| `stores/`              | Estado persistido com Zustand                      |
| `i18n/`                | Configuração e locale files do next-intl           |
| `types/`               | Interfaces e tipos TypeScript                      |
| `providers/`           | React context providers globais                    |
| `supabase/migrations/` | DDL SQL versionado                                 |
