# 02 — Arquitetura

## Princípio central

```
Dados em Supabase (PostgreSQL)
  ↓
Server Components buscam dados (sem waterfall)
  ↓
Client Components recebem dados como props
  ↓
Zustand gerencia estado local/derivado
  ↓
TanStack Query gerencia cache + mutações
  ↓
Tailwind + CSS variables = visual
```

---

## RSC vs Client Components — regra de decisão

| Situação                      | Tipo de componente   |
| ----------------------------- | -------------------- |
| Busca dados do Supabase       | **Server Component** |
| Renderiza listas estáticas    | **Server Component** |
| SEO / metadata por página     | **Server Component** |
| Usa `useState`, `useEffect`   | **Client Component** |
| Usa Zustand store             | **Client Component** |
| Usa TanStack Query            | **Client Component** |
| Filtros, busca interativa     | **Client Component** |
| Calculadoras (input → output) | **Client Component** |
| Modais, dropdowns             | **Client Component** |

---

## Camadas da aplicação

### Camada 1 — Dados (Supabase)

Tabelas públicas com RLS read-only:

- `divine_book_tabs`
- `items` (livros divinos + materiais)
- `recipes`
- `dusk_drops` (dungeon → boss → drops)
- `equipments`
- `stones`

Dados do usuário ficam em `localStorage` via Zustand persist
(sem auth, sem servidor — igual ao comportamento atual).

### Camada 2 — Busca de dados (Server Components + TanStack Query)

Cada página usa Server Components para o fetch inicial.
Interações subsequentes (filtros, buscas) usam TanStack Query no client.

Exemplo:

```tsx
// app/divine-books/page.tsx — Server Component
export default async function DivineBooksPage() {
  const catalog = await getDivineBooksInitialData(); // fetch server-side
  return <DivineBooksBrowser initialData={catalog} />;
}

// components/features/divine-books/DivineBooksBrowser.tsx — Client Component
("use client");
export function DivineBooksBrowser({ initialData }) {
  const { data } = useQuery({
    queryKey: ["divine-books"],
    queryFn: fetchDivineBooks,
    initialData, // hydrata do servidor, sem loading state inicial
  });
  // ...
}
```

### Camada 3 — Estado (Zustand)

Estado que persiste entre navegações ou precisa ser compartilhado entre componentes:

- `useDivineBooksStore` → owned, filters, presets, treeProgress
- `useAppStore` → tema, idioma, preferências

Estado local simples (`useState`) para:

- Open/close de modais
- Valor de input antes de debounce

### Camada 4 — Lógica de cálculo (utils puros)

Os calculadores atuais (do Worker) são funções puras JavaScript.
Eles **não dependem de DOM** e podem ser movidos diretamente para `src/lib/calculators/`.

```
src/shared/worker/divine-books.calculator.js
  → src/lib/calculators/divine-books.ts
```

Chamar diretamente nos Server Components ou no client — sem Worker.

### Camada 5 — UI (React + Tailwind)

Componentes React substituem templates string do LiteDom.
Lucide React substitui o helper `Icon({ icon })`.

---

## Roteamento

| Rota atual (hash) | Rota Next.js    |
| ----------------- | --------------- |
| `/#/`             | `/`             |
| `/#/dusk`         | `/dusk`         |
| `/#/equipments`   | `/equipments`   |
| `/#/divine-books` | `/divine-books` |
| `/#/stones`       | `/stones`       |

Rota de detalhe (nova, possível com App Router):

```
/divine-books/[id]  — detalhe de um livro divino
/dusk/[id]          — detalhe de uma dungeon
```

---

## Padrão de busca de dados

### Server Component (sem cache de usuário)

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
}
```

```ts
// src/lib/queries/divine-books.ts
export async function getDivineBookCatalog() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("items")
    .select("*, recipes(*), divine_book_tabs(*)")
    .eq("type", "divine-book")
    .order("level");

  if (error) throw new Error(error.message);
  return data;
}
```

### Client Component (TanStack Query)

```ts
// src/hooks/useDivineBooks.ts
export function useDivineBooks(filters: DivineBookFilters) {
  return useQuery({
    queryKey: ["divine-books", filters],
    queryFn: () => fetchDivineBooksClient(filters),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}
```

---

## Fluxo de dados — Livros Divinos como exemplo

```
Supabase
  │
  ├─ Server: getDivineBookCatalog()
  │    └─ DivineBooksPage (RSC)
  │         └─ <DivineBooksBrowser initialData={...} />
  │              │
  │              ├─ TanStack Query (client fetch com filtros)
  │              ├─ useDivineBooksStore (owned, presets — localStorage)
  │              └─ createDivineBooksService() (calculadora pura)
  │                   ↓
  │              <DivineBookCard />
  │              <DivineBookFilters />
  │              <DivineBookMaterialsSummary />
```

---

## Segurança

- Supabase com RLS habilitado em todas as tabelas
- Acesso público somente via `anon_key` com `SELECT` permitido
- Dados do usuário nunca saem do navegador (localStorage)
- Sem server actions que escrevam em banco (sem auth)
- Nenhum `eval` ou `dangerouslySetInnerHTML` sem sanitização
