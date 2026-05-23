# Checklist de Migração

Use este arquivo para rastrear o progresso do refactor.

---

## Fase 1 — Setup

- [ ] Rodar `npx create-next-app@latest perfect-world-helper --typescript --tailwind --eslint --app --import-alias "@/*"`
- [ ] Atualizar Tailwind para v4 (`@tailwindcss/postcss`) — já incluso no Next.js 16
- [ ] Instalar dependências de produção (Supabase, TanStack Query, Zustand, next-intl, next-themes, lucide-react)
- [ ] Configurar `.env.local`
- [ ] Configurar `next.config.ts`
- [ ] Criar projeto no Supabase (região São Paulo)
- [ ] Copiar `public/assets/` do projeto atual

---

## Fase 2 — Banco de dados

- [ ] Rodar migration `001_create_items.sql`
- [ ] Rodar migration `002_create_recipes.sql`
- [ ] Rodar migration `003_create_dusk_drops.sql`
- [ ] Rodar migration `004_create_equipments.sql`
- [ ] Rodar migration `005_create_stones.sql`
- [ ] Criar script `scripts/seed-supabase.ts`
- [ ] Rodar seed com dados de `divine-books.json` ← aguardando SUPABASE_SERVICE_ROLE_KEY
- [ ] Rodar seed com dados de `dusk-drops.json`
- [ ] Rodar seed com dados de `equipments.json`
- [ ] Rodar seed com dados de `stones.json`
- [ ] Gerar tipos TypeScript: `npm run db:types`

---

## Fase 3 — Infraestrutura da app

- [ ] Criar `src/lib/supabase/client.ts`
- [ ] Criar `src/lib/supabase/server.ts`
- [ ] Criar `src/providers/QueryProvider.tsx`
- [ ] Criar `src/providers/ThemeProvider.tsx`
- [ ] Criar `src/i18n/routing.ts`
- [ ] Criar `src/i18n/request.ts`
- [ ] Criar `src/middleware.ts`
- [ ] Copiar e adaptar locale files para `src/i18n/locales/`
- [ ] Criar `src/app/[locale]/layout.tsx` com todos os providers
- [ ] Configurar CSS variables em `src/app/globals.css`
- [ ] Criar `src/stores/app.store.ts`
- [ ] Criar script anti-FOUC no layout

---

## Fase 4 — Componentes UI base

- [ ] `Button.tsx`
- [ ] `Input.tsx`
- [ ] `Select.tsx`
- [ ] `Modal.tsx`
- [ ] `Tabs.tsx`
- [ ] `Toggle.tsx`
- [ ] `Switch.tsx`
- [ ] `Dropdown.tsx`
- [ ] `Textarea.tsx`
- [ ] `AppHeader.tsx`
- [ ] `AppNav.tsx`
- [ ] `AppFooter.tsx`
- [ ] `StylePresetSwitcher.tsx`
- [ ] `LanguageSwitcher.tsx`

---

## Fase 5 — Feature: Livros Divinos

- [ ] Criar `src/types/divine-books.ts`
- [ ] Migrar calculadora para `src/lib/calculators/divine-books.ts`
- [ ] Criar `src/lib/queries/divine-books.ts`
- [ ] Criar `src/hooks/useDivineBooks.ts`
- [ ] Criar `src/stores/divine-books.store.ts`
- [ ] Criar `app/[locale]/divine-books/page.tsx`
- [ ] Criar `DivineBooksBrowser.tsx`
- [ ] Criar `DivineBookCard.tsx`
- [ ] Criar `DivineBookFilters.tsx`
- [ ] Criar `DivineBookMaterialsSummary.tsx`
- [ ] Criar `DivineBookTreeView.tsx`
- [ ] Testar calculadora com Vitest

---

## Fase 6 — Feature: Drops Dusk

- [ ] Criar `src/types/dusk-drops.ts`
- [ ] Criar `src/lib/queries/dusk-drops.ts`
- [ ] Criar `src/hooks/useDuskDrops.ts`
- [ ] Criar `src/stores/dusk-drops.store.ts`
- [ ] Criar `app/[locale]/dusk/page.tsx`
- [ ] Criar `DuskDropsBrowser.tsx`
- [ ] Criar `DuskDropTable.tsx`
- [ ] Criar `DuskDropFilters.tsx`

---

## Fase 7 — Feature: Equipamentos

- [ ] Criar `src/types/equipments.ts`
- [ ] Migrar calculadora para `src/lib/calculators/equipments.ts`
- [ ] Criar `src/lib/queries/equipments.ts`
- [ ] Criar `src/hooks/useEquipments.ts`
- [ ] Criar `src/stores/equipments.store.ts`
- [ ] Criar `app/[locale]/equipments/page.tsx`
- [ ] Criar `EquipmentsBrowser.tsx`
- [ ] Criar `EquipmentFilters.tsx`
- [ ] Criar `EquipmentMaterialsList.tsx`
- [ ] Testar calculadora com Vitest

---

## Fase 8 — Feature: Pedras

- [ ] Criar `src/types/stones.ts`
- [ ] Migrar calculadora para `src/lib/calculators/stones.ts`
- [ ] Criar `src/lib/queries/stones.ts`
- [ ] Criar `src/hooks/useStones.ts`
- [ ] Criar `src/stores/stones.store.ts`
- [ ] Criar `app/[locale]/stones/page.tsx`
- [ ] Criar `StonesCalculator.tsx`
- [ ] Criar `StoneResult.tsx`
- [ ] Testar calculadora com Vitest

---

## Fase 9 — Qualidade e deploy

- [ ] Rodar `npm run build` sem erros
- [ ] Rodar `npm run test:run` — todos os testes passando
- [ ] Verificar acessibilidade (teclado, aria, contraste)
- [ ] Verificar responsividade (mobile, tablet, desktop)
- [ ] Verificar troca de idioma funcionando
- [ ] Verificar troca de tema funcionando
- [ ] Verificar persistência de estado (owned, seleção)
- [ ] Configurar variáveis na Vercel
- [ ] Primeiro deploy: `vercel --prod`
- [ ] Configurar GitHub Actions

---

## Decisões a confirmar antes de iniciar

| Decisão            | Opção A              | Opção B                         | Recomendação                |
| ------------------ | -------------------- | ------------------------------- | --------------------------- |
| Routing com locale | Prefixo `/pt-BR/...` | Sem prefixo (as-needed)         | `as-needed`                 |
| Dados no Supabase  | Todas as features    | Só Divine Books inicialmente    | Só Divine Books             |
| Auth               | Sem auth             | Auth anônima                    | Sem auth                    |
| Cache Supabase     | JS client            | `fetch` nativo com `revalidate` | JS client + staleTime longo |
| Preset storage     | Zustand persist      | next-themes `defaultTheme`      | Zustand persist             |
