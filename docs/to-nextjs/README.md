# Migração: Vite + LiteDom → Next.js + Supabase

## Visão Geral

Este diretório documenta o plano completo de refactor do **Perfect World Helper** de uma SPA estática (Vite + LiteDom + JSON) para uma aplicação Next.js com Supabase, hospedada na Vercel (free tier).

---

## Por que migrar?

| Problema atual                                         | Solução com Next.js + Supabase                           |
| ------------------------------------------------------ | -------------------------------------------------------- |
| LiteDom requer gerenciamento manual de DOM com strings | React components com tipagem e re-renders automáticos    |
| Web Workers necessários para não bloquear a UI         | Server Components e Server Actions processam no servidor |
| JSON bundlado aumenta o tamanho do build               | Dados em Supabase com caching via TanStack Query         |
| Hash routing limita SEO e compartilhamento de links    | App Router com URLs reais e metadata por página          |
| Estado global manual via localStorage                  | Zustand com middleware `persist`                         |
| Escapar HTML manualmente em todo template string       | JSX escapa por padrão                                    |

---

## Stack nova

| Camada           | Tecnologia                          |
| ---------------- | ----------------------------------- |
| Framework        | Next.js 16 ou superior (App Router) |
| Linguagem        | TypeScript                          |
| Estilização      | Tailwind CSS v4                     |
| Banco de dados   | Supabase (PostgreSQL)               |
| State management | Zustand                             |
| Data fetching    | TanStack Query v5                   |
| Ícones           | lucide-react                        |
| i18n             | next-intl                           |
| Temas            | next-themes + CSS variables         |
| Hospedagem       | Vercel (free tier)                  |

---

## Índice da documentação

| Arquivo                                                    | Conteúdo                                               |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| [01-project-setup.md](./01-project-setup.md)               | Criação do projeto com `create-next-app`, dependências |
| [02-architecture.md](./02-architecture.md)                 | Decisões arquiteturais, RSC vs Client Components       |
| [03-folder-structure.md](./03-folder-structure.md)         | Estrutura de pastas completa                           |
| [04-supabase-schema.md](./04-supabase-schema.md)           | Schema SQL do Supabase, RLS policies                   |
| [05-state-management.md](./05-state-management.md)         | Stores Zustand (por feature)                           |
| [06-data-fetching.md](./06-data-fetching.md)               | TanStack Query + Supabase client                       |
| [07-feature-divine-books.md](./07-feature-divine-books.md) | Migração completa de Livros Divinos                    |
| [08-feature-dusk-drops.md](./08-feature-dusk-drops.md)     | Migração de Drops Dusk                                 |
| [09-feature-equipments.md](./09-feature-equipments.md)     | Migração de Equipamentos                               |
| [10-feature-stones.md](./10-feature-stones.md)             | Migração de Pedras                                     |
| [11-i18n.md](./11-i18n.md)                                 | Migração de i18n para next-intl                        |
| [12-theming.md](./12-theming.md)                           | Style presets com next-themes                          |
| [13-deployment.md](./13-deployment.md)                     | Vercel + Supabase, variáveis de ambiente               |

---

## Mapa de equivalências

```
Vite + LiteDom                Next.js
─────────────────────────────────────────────────────
src/main.js                → app/layout.tsx
src/features/*/pages/*.js  → app/(features)/*/page.tsx
src/shared/components/ui/  → components/ui/
src/shared/worker/         → lib/calculators/ (pure utils)
src/shared/i18n/           → i18n/ (next-intl)
src/shared/styles/         → app/globals.css + tailwind
src/shared/stores/         → stores/ (Zustand)
src/features/*/worker/     → lib/services/ (server utils)
src/features/*/data/*.json → Supabase tables
```

---

## Prioridade de migração

1. Setup e infraestrutura (Supabase + Vercel)
2. Livros Divinos (feature mais complexa, melhor benchmark)
3. Drops Dusk
4. Equipamentos
5. Pedras
6. i18n e temas
