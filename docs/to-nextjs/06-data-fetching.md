# 06 — Data Fetching com TanStack Query

## Setup

### `src/providers/QueryProvider.tsx`

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10, // 10 min — dados de jogo mudam raramente
            gcTime: 1000 * 60 * 30, // 30 min em cache
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

Adicionar ao `app/layout.tsx`:

```tsx
import { QueryProvider } from "@/providers/QueryProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

---

## Clientes Supabase

### `src/lib/supabase/client.ts` — Browser

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
```

### `src/lib/supabase/server.ts` — Server Components

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );
}
```

---

## Queries por feature

### `src/lib/queries/divine-books.ts`

```ts
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DivineBookCatalog } from "@/types/divine-books";

// Server-side (RSC)
export async function getDivineBookCatalogServer(): Promise<DivineBookCatalog> {
  const supabase = await getSupabaseServerClient();

  const [tabsResult, itemsResult, recipesResult] = await Promise.all([
    supabase.from("divine_book_tabs").select("*").order("sort_order"),
    supabase.from("items").select("*").order("level", { nullsFirst: true }),
    supabase
      .from("recipes")
      .select("*, recipe_materials(*, items(*))")
      .order("sort_order"),
  ]);

  if (tabsResult.error) throw new Error(tabsResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (recipesResult.error) throw new Error(recipesResult.error.message);

  return {
    schemaVersion: 1,
    tabs: tabsResult.data,
    items: itemsResult.data,
    recipes: recipesResult.data,
  };
}

// Client-side (TanStack Query)
export async function getDivineBookCatalogClient(): Promise<DivineBookCatalog> {
  const supabase = getSupabaseBrowserClient();

  const [tabsResult, itemsResult, recipesResult] = await Promise.all([
    supabase.from("divine_book_tabs").select("*").order("sort_order"),
    supabase.from("items").select("*").order("level", { nullsFirst: true }),
    supabase
      .from("recipes")
      .select("*, recipe_materials(*, items(*))")
      .order("sort_order"),
  ]);

  if (tabsResult.error) throw new Error(tabsResult.error.message);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (recipesResult.error) throw new Error(recipesResult.error.message);

  return {
    schemaVersion: 1,
    tabs: tabsResult.data,
    items: itemsResult.data,
    recipes: recipesResult.data,
  };
}
```

### `src/lib/queries/dusk-drops.ts`

```ts
export async function getDuskDropsClient() {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("dusk_drops")
    .select(
      `
      *,
      dusk_bosses (
        *,
        dusk_boss_drops (
          *,
          items (id, name, icon, type)
        )
      )
    `,
    )
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data;
}
```

### `src/lib/queries/equipments.ts`

```ts
export async function getEquipmentsClient() {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("equipments")
    .select(`*, equipment_materials(*, items(id, name, icon))`)
    .order("level")
    .order("name");

  if (error) throw new Error(error.message);
  return data;
}
```

### `src/lib/queries/stones.ts`

```ts
export async function getStonesClient() {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("stones")
    .select(`*, stone_recipe_materials(*, items(id, name, icon))`)
    .order("level");

  if (error) throw new Error(error.message);
  return data;
}
```

---

## Custom hooks

### `src/hooks/useDivineBooks.ts`

```ts
import { useQuery } from "@tanstack/react-query";
import { getDivineBookCatalogClient } from "@/lib/queries/divine-books";
import type { DivineBookCatalog } from "@/types/divine-books";

export const divineBooksQueryKey = ["divine-books-catalog"] as const;

export function useDivineBooksQuery(initialData?: DivineBookCatalog) {
  return useQuery({
    queryKey: divineBooksQueryKey,
    queryFn: getDivineBookCatalogClient,
    initialData,
    staleTime: 1000 * 60 * 30, // 30 min (dados estáticos de jogo)
  });
}
```

### `src/hooks/useDuskDrops.ts`

```ts
export function useDuskDropsQuery() {
  return useQuery({
    queryKey: ["dusk-drops"],
    queryFn: getDuskDropsClient,
    staleTime: 1000 * 60 * 30,
  });
}
```

---

## Padrão de hidratação (Server → Client)

O padrão recomendado é passar `initialData` do Server Component para o
Client Component, que o repassa para o TanStack Query. Desta forma:

- Sem loading state inicial (SSR já rendeu)
- TanStack Query revalida em background quando `staleTime` expirar
- Funciona perfeitamente com Vercel Edge Cache

```tsx
// app/divine-books/page.tsx
import { getDivineBookCatalogServer } from "@/lib/queries/divine-books";
import { DivineBooksBrowser } from "@/components/features/divine-books/DivineBooksBrowser";

export default async function DivineBooksPage() {
  const initialData = await getDivineBookCatalogServer();
  return <DivineBooksBrowser initialData={initialData} />;
}

// components/features/divine-books/DivineBooksBrowser.tsx
("use client");
export function DivineBooksBrowser({ initialData }) {
  const { data: catalog } = useDivineBooksQuery(initialData);
  // ...
}
```

---

## Query Keys — convenção

```ts
// Sempre use arrays para compor query keys
["divine-books-catalog"][("divine-book", bookId)]["dusk-drops"][ // lista completa // item individual // lista completa
  ("dusk-drops", { mode: "solo" })
]["equipments"][("equipments", { type: "weapon", level: 90 })]["stones"]; // com filtro
```
