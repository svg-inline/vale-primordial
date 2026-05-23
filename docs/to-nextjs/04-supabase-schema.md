# 04 — Schema do Supabase

## Visão geral das tabelas

```
divine_book_tabs
items (divine-books + materials)
recipes
dusk_drops
dusk_bosses
dusk_boss_drops
equipments
equipment_materials
stones
```

---

## Migrations SQL

### `001_create_items.sql`

```sql
-- Habilitar extensão para UUIDs
create extension if not exists "uuid-ossp";

-- Tabela principal de itens (livros divinos + materiais)
create table items (
  id            text primary key,             -- ex: "divine-book-poder-interno"
  type          text not null                 -- "divine-book" | "material"
                check (type in ('divine-book', 'material')),
  name          text not null,
  level         integer,
  icon          text,                         -- caminho relativo: "assets/divine-books/1-5.png"
  description   text default '',
  effects       text[] default '{}',          -- apenas para divine-books
  tabs          text[] default '{}',          -- IDs das abas onde aparece
  created_at    timestamptz default now()
);

-- Tabela de abas dos livros divinos
create table divine_book_tabs (
  id          text primary key,               -- ex: "divine-books-tab-1"
  label       text not null,                  -- ex: "Aba I"
  sort_order  integer not null default 0,
  created_at  timestamptz default now()
);

-- Índices
create index items_type_idx on items (type);
create index items_name_idx on items using gin (to_tsvector('portuguese', name));

-- RLS: somente leitura pública
alter table items enable row level security;
alter table divine_book_tabs enable row level security;

create policy "Public read items" on items
  for select using (true);

create policy "Public read divine_book_tabs" on divine_book_tabs
  for select using (true);
```

### `002_create_recipes.sql`

```sql
-- Receitas de criação (quais materiais um item precisa)
create table recipes (
  id              uuid primary key default uuid_generate_v4(),
  result_item_id  text not null references items(id) on delete cascade,
  sort_order      integer not null default 0,
  created_at      timestamptz default now()
);

-- Materiais de cada receita
create table recipe_materials (
  id          uuid primary key default uuid_generate_v4(),
  recipe_id   uuid not null references recipes(id) on delete cascade,
  item_id     text not null references items(id) on delete cascade,
  quantity    integer not null default 1,
  sort_order  integer not null default 0
);

-- Índices
create index recipes_result_item_idx on recipes (result_item_id);
create index recipe_materials_recipe_idx on recipe_materials (recipe_id);
create index recipe_materials_item_idx on recipe_materials (item_id);

-- RLS
alter table recipes enable row level security;
alter table recipe_materials enable row level security;

create policy "Public read recipes" on recipes for select using (true);
create policy "Public read recipe_materials" on recipe_materials for select using (true);
```

### `003_create_dusk_drops.sql`

```sql
-- Dungeons Dusk
create table dusk_drops (
  id          text primary key,         -- ex: "dusk-1-1"
  name        text not null,
  mode        text not null             -- "solo" | "group"
              check (mode in ('solo', 'group')),
  sort_order  integer not null default 0,
  created_at  timestamptz default now()
);

-- Bosses de cada dungeon
create table dusk_bosses (
  id          text primary key,         -- ex: "boss-magni-1-1"
  dusk_id     text not null references dusk_drops(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0
);

-- Drops de cada boss
create table dusk_boss_drops (
  id            uuid primary key default uuid_generate_v4(),
  boss_id       text not null references dusk_bosses(id) on delete cascade,
  item_id       text not null references items(id) on delete cascade,
  quantity_min  integer not null default 1,
  quantity_max  integer not null default 1,
  chance        numeric(5,4),           -- null = garantido; 0.1500 = 15%
  sort_order    integer not null default 0
);

-- Índices
create index dusk_bosses_dusk_idx on dusk_bosses (dusk_id);
create index dusk_boss_drops_boss_idx on dusk_boss_drops (boss_id);
create index dusk_boss_drops_item_idx on dusk_boss_drops (item_id);

-- RLS
alter table dusk_drops enable row level security;
alter table dusk_bosses enable row level security;
alter table dusk_boss_drops enable row level security;

create policy "Public read dusk_drops" on dusk_drops for select using (true);
create policy "Public read dusk_bosses" on dusk_bosses for select using (true);
create policy "Public read dusk_boss_drops" on dusk_boss_drops for select using (true);
```

### `004_create_equipments.sql`

```sql
-- Equipamentos
create table equipments (
  id          text primary key,         -- ex: "equipment-arcane-weapon-90"
  name        text not null,
  type        text not null             -- "weapon" | "armor" | "ornament"
              check (type in ('weapon', 'armor', 'ornament')),
  class       text not null default 'all',
  level       integer not null,
  grade       integer not null default 1,
  created_at  timestamptz default now()
);

-- Materiais necessários por equipamento
create table equipment_materials (
  id            uuid primary key default uuid_generate_v4(),
  equipment_id  text not null references equipments(id) on delete cascade,
  item_id       text not null references items(id) on delete cascade,
  quantity      integer not null default 1
);

-- Índices
create index equipments_type_idx on equipments (type);
create index equipments_level_idx on equipments (level);
create index equipment_materials_equip_idx on equipment_materials (equipment_id);

-- RLS
alter table equipments enable row level security;
alter table equipment_materials enable row level security;

create policy "Public read equipments" on equipments for select using (true);
create policy "Public read equipment_materials" on equipment_materials for select using (true);
```

### `005_create_stones.sql`

```sql
-- Pedras de forja
create table stones (
  id          text primary key,       -- ex: "stone-level-1"
  name        text not null,
  level       integer not null unique,
  created_at  timestamptz default now()
);

-- Receita de cada pedra (ingredientes para forjar)
create table stone_recipe_materials (
  id          uuid primary key default uuid_generate_v4(),
  stone_id    text not null references stones(id) on delete cascade,
  item_id     text references items(id) on delete set null,
  stone_id_ref text references stones(id) on delete set null,  -- pedra de nível inferior como ingrediente
  quantity    integer not null default 1,
  sort_order  integer not null default 0,
  check (item_id is not null or stone_id_ref is not null)
);

-- RLS
alter table stones enable row level security;
alter table stone_recipe_materials enable row level security;

create policy "Public read stones" on stones for select using (true);
create policy "Public read stone_recipe_materials" on stone_recipe_materials for select using (true);
```

---

## Queries de exemplo

### Buscar catálogo completo de livros divinos

```sql
select
  i.id,
  i.name,
  i.level,
  i.icon,
  i.effects,
  i.tabs,
  json_agg(
    json_build_object(
      'id', r.id,
      'materials', (
        select json_agg(
          json_build_object(
            'itemId', rm.item_id,
            'quantity', rm.quantity,
            'itemName', mi.name,
            'itemIcon', mi.icon
          )
          order by rm.sort_order
        )
        from recipe_materials rm
        join items mi on mi.id = rm.item_id
        where rm.recipe_id = r.id
      )
    )
    order by r.sort_order
  ) filter (where r.id is not null) as recipes
from items i
left join recipes r on r.result_item_id = i.id
where i.type = 'divine-book'
group by i.id
order by i.level, i.name;
```

---

## Carregando dados JSON para o Supabase

Criar `scripts/seed-supabase.ts` para migrar os JSONs atuais:

```ts
import { createClient } from "@supabase/supabase-js";
import divineBooks from "../src/features/divine-books/data/divine-books.json";
import duskDrops from "../src/features/dusk-drops/data/dusk-drops.json";
import equipments from "../src/features/equipments/data/equipments.json";
import stones from "../src/features/stones/data/stones.json";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service_role para writes no seed
);

async function seedDivineBooks() {
  // 1. Inserir tabs
  await supabase.from("divine_book_tabs").upsert(
    divineBooks.tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      sort_order: tab.sortOrder,
    })),
  );

  // 2. Inserir itens
  const items = divineBooks.items.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    level: item.level ?? null,
    icon: item.icon ?? null,
    description: item.description ?? "",
    effects: item.effects ?? [],
    tabs: item.tabs ?? [],
  }));

  await supabase.from("items").upsert(items);

  // 3. Inserir receitas
  for (const recipe of divineBooks.recipes) {
    const { data: recipeRow } = await supabase
      .from("recipes")
      .insert({
        result_item_id: recipe.resultItemId,
        sort_order: recipe.sortOrder ?? 0,
      })
      .select()
      .single();

    if (recipeRow && recipe.materials) {
      await supabase.from("recipe_materials").insert(
        recipe.materials.map((m, idx) => ({
          recipe_id: recipeRow.id,
          item_id: m.itemId,
          quantity: m.quantity,
          sort_order: idx,
        })),
      );
    }
  }
}

async function main() {
  await seedDivineBooks();
  // await seedDuskDrops();
  // await seedEquipments();
  // await seedStones();
  console.log("Seed concluído.");
}

main().catch(console.error);
```

Adicionar ao `package.json`:

```json
"db:seed": "tsx scripts/seed-supabase.ts"
```
