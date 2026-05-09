# AGENTS.md

## Project

Perfect World Helper is a static GitHub Pages project for players of **Perfect World**.

The site provides:

- Dusk drops lookup.
- Equipment list with required materials.
- Material farming helper.
- Divine Book calculator.
- Stone forging calculator.

This project must run as a **static frontend-only application**.

No backend is allowed in the default architecture.

---

## Core Stack

Use the following stack:

- Vite
- TypeScript
- Tailwind CSS
- LiteDom.js
- Web Worker
- JSON data files
- Vitest
- GitHub Actions
- GitHub Pages

Optional, only when justified:

- MiniSearch for fuzzy search.
- Valibot for JSON/data validation.
- idb for IndexedDB caching.
- vite-plugin-pwa for offline support.

Avoid unless explicitly requested:

- React
- Next.js
- Vue
- Svelte
- Backend APIs
- Firebase
- Supabase
- Runtime server dependencies

---

## Architecture

The project must follow this separation:

```txt
UI Layer
  ↓
LiteDom Components / Stores
  ↓
Worker Client
  ↓
Web Worker
  ↓
JSON Data + Search + Filters + Calculations
```

### Main rule

LiteDom is for the interface.

Worker is for data processing.

JSON is the database.

Tailwind is the visual layer.

Do not mix these responsibilities.

---

## Folder Structure

Recommended structure:

```txt
perfect-world-helper/
├─ public/
│  └─ vendor/
│     └─ litedom.js
├─ src/
│  ├─ app/
│  │  ├─ router.ts
│  │  ├─ routes.ts
│  │  └─ bootstrap.ts
│  ├─ components/
│  │  ├─ AppShell.ts
│  │  ├─ ItemCard.ts
│  │  ├─ SearchInput.ts
│  │  ├─ FilterSelect.ts
│  │  ├─ MaterialList.ts
│  │  └─ CalculatorResult.ts
│  ├─ data/
│  │  ├─ items.json
│  │  ├─ dusk-drops.json
│  │  ├─ equipments.json
│  │  ├─ divine-books.json
│  │  └─ stones.json
│  ├─ pages/
│  │  ├─ HomePage.ts
│  │  ├─ DuskDropsPage.ts
│  │  ├─ EquipmentsPage.ts
│  │  ├─ DivineBooksPage.ts
│  │  └─ StonesPage.ts
│  ├─ stores/
│  │  ├─ app.store.ts
│  │  ├─ filters.store.ts
│  │  └─ calculator.store.ts
│  ├─ workers/
│  │  ├─ data.worker.ts
│  │  ├─ worker-client.ts
│  │  ├─ search.ts
│  │  ├─ filters.ts
│  │  └─ calculators.ts
│  ├─ schemas/
│  │  ├─ item.schema.ts
│  │  ├─ dusk.schema.ts
│  │  ├─ equipment.schema.ts
│  │  ├─ divine-book.schema.ts
│  │  └─ stone.schema.ts
│  ├─ utils/
│  │  ├─ escape-html.ts
│  │  ├─ format.ts
│  │  └─ normalize.ts
│  ├─ styles/
│  │  └─ main.css
│  └─ main.ts
├─ tests/
│  ├─ calculators/
│  ├─ search/
│  └─ data/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.ts
└─ AGENTS.md
```

---

## GitHub Pages Rules

The app must be compatible with GitHub Pages.

Use hash routing by default:

```txt
/#/
/#/dusk
/#/equipments
/#/divine-books
/#/stones
```

Do not rely on server-side redirects.

Do not require runtime server configuration.

All assets must work with Vite base path configuration.

Use relative-safe asset URLs.

---

## LiteDom Rules

Use LiteDom for:

- Component mounting.
- Page rendering.
- UI state.
- Stores.
- DOM events.
- Small local interactions.
- Local preferences.
- Theme toggles.
- Favorites.
- Recent calculations.

Do not use LiteDom inside Web Workers.

Reason: LiteDom depends on browser DOM APIs like `document`, `window`, `Element`, `querySelectorAll`, `innerHTML`, `IntersectionObserver`, and event handling.

### Safe LiteDom usage

Prefer:

```ts
component("#app", () => {
  return `
    <main class="app">
      ...
    </main>
  `;
});
```

Use delegated actions where possible:

```ts
component("#app", renderPage)
  .on("search", handleSearch)
  .on("clearFilters", handleClearFilters);
```

### Dangerous LiteDom usage

Avoid injecting raw JSON values directly into HTML.

Bad:

```ts
return `<h2>${item.name}</h2>`;
```

Good:

```ts
return `<h2>${escapeHtml(item.name)}</h2>`;
```

Because LiteDom renders through `innerHTML`, all dynamic strings from JSON or user input must be escaped.

---

## Web Worker Rules

Use Worker for:

- Loading JSON data.
- Normalizing data.
- Building search indexes.
- Filtering Dusk drops.
- Searching items.
- Calculating equipment materials.
- Calculating Divine Books.
- Calculating stone forging.
- Aggregating farming lists.
- Cross-referencing item sources and usage.

Do not use Worker for:

- DOM manipulation.
- Tailwind class decisions that depend on viewport.
- Direct UI updates.
- LiteDom components.
- Browser event binding.

### Worker message pattern

Use typed messages.

Example:

```ts
type WorkerRequest =
  | { type: "INIT" }
  | { type: "SEARCH_ITEMS"; query: string }
  | { type: "FILTER_DUSK"; filters: DuskFilters }
  | { type: "CALCULATE_EQUIPMENT"; equipmentIds: string[] }
  | {
      type: "CALCULATE_DIVINE_BOOK";
      bookId: string;
      owned: Record<string, number>;
    }
  | {
      type: "CALCULATE_STONES";
      fromLevel: number;
      toLevel: number;
      quantity: number;
    };
```

Responses must also be typed:

```ts
type WorkerResponse =
  | { type: "READY" }
  | { type: "SEARCH_ITEMS_RESULT"; items: Item[] }
  | { type: "FILTER_DUSK_RESULT"; results: DuskDropResult[] }
  | { type: "CALCULATION_RESULT"; result: CalculationResult }
  | { type: "ERROR"; message: string };
```

The UI must not know internal Worker implementation details.

---

## Data Rules

The project data must be stored in JSON files.

Data must be normalized enough to avoid duplicated logic.

Prefer IDs over repeated names.

### Item model (APENAS PARA EXEMPLIFICAR O FORMATO, NÃO É UM MODELO DEFINITIVO)

```json
{
  "id": "item-dust-of-devil",
  "name": "Dust of Devil",
  "category": "dusk-material",
  "grade": 90,
  "icon": "/assets/items/dust-of-devil.webp",
  "description": ""
}
```

### Dusk drop model

```json
{
  "id": "dusk-1-1",
  "name": "Dusk 1-1",
  "mode": "solo",
  "bosses": [
    {
      "id": "boss-example",
      "name": "Boss Example",
      "drops": [
        {
          "itemId": "item-dust-of-devil",
          "quantityMin": 1,
          "quantityMax": 1,
          "chance": null
        }
      ]
    }
  ]
}
```

### Equipment model

```json
{
  "id": "equipment-example",
  "name": "Example Weapon",
  "type": "weapon",
  "class": "all",
  "level": 90,
  "grade": 11,
  "materials": [
    {
      "itemId": "item-dust-of-devil",
      "quantity": 8
    }
  ]
}
```

### Divine Book model

```json
{
  "id": "divine-book-example",
  "name": "Example Divine Book",
  "materials": [
    {
      "itemId": "item-page-example",
      "quantity": 50
    }
  ]
}
```

### Stone model

```json
{
  "id": "stone-level-1",
  "name": "Stone Lv. 1",
  "level": 1,
  "recipe": null
}
```

---

## Calculation Rules

Calculators must be deterministic.

Same input must always return the same output.

Do not depend on DOM state inside calculation functions.

Calculation functions must be pure whenever possible.

Good:

```ts
calculateStoneCost(input, stoneTable);
```

Bad:

```ts
calculateStoneCostFromSelectedInputs();
```

### Equipment material calculation

Must support:

- Single equipment.
- Multiple selected equipment.
- Total quantity per material.
- Source lookup per material.
- Grouping by Dusk dungeon.
- Grouping by boss.
- Missing data warnings.

### Divine Book calculation

Must support:

- Required materials.
- Owned materials.
- Missing quantity.
- Optional price per material.
- Total estimated cost when prices are provided.

### Stone calculation

Must support:

- From level.
- To level.
- Desired final quantity.
- Required base stones.
- Optional cost estimation.
- Invalid range validation.

---

## Search and Filter Rules

Search must support:

- Item name.
- Dungeon name.
- Boss name.
- Equipment name.
- Material name.

Filters should support:

- Dusk dungeon.
- Boss.
- Item category.
- Equipment type.
- Equipment level.
- Class.
- Grade.

Search and filter logic belongs in the Worker.

The UI only sends query/filter state and renders results.

---

## Tailwind Rules

Use Tailwind for layout and visual styling.

Prefer semantic HTML first, Tailwind second.

Avoid building inaccessible div-only interfaces.

Good:

```html
<button type="button" class="...">Search</button>
```

Bad:

```html
<div class="..." onclick="...">Search</div>
```

Use responsive layouts.

The UI must work on mobile first.

Recommended visual direction:

- Dark theme by default.
- Game helper/dashboard style.
- Clear cards.
- Strong contrast.
- Readable tables.
- Compact filters.
- Mobile-friendly calculators.

---

## Accessibility Rules

All interactive elements must be keyboard accessible.

Use:

- `button` for actions.
- `a` for navigation.
- `label` for inputs.
- `aria-expanded` for collapsible filters.
- `aria-current="page"` for active route.
- `aria-live` for calculator results when useful.

Do not remove focus styles.

Do not rely on color alone to convey meaning.

Tables must use proper `thead`, `tbody`, `th`, and `td`.

---

## SEO Rules

Even as a SPA, keep the base HTML useful.

Each page render should update:

- `document.title`
- meta description when possible
- visible `h1`

Use clear route titles:

- Perfect World Helper
- Drops Dusk
- Equipamentos
- Livros Divinos
- Pedras

Do not hide the main content behind inaccessible scripts without fallback text.

---

## Security Rules

This is a static project, but security still matters.

Mandatory:

- Escape all JSON/user strings before inserting into `innerHTML`.
- Never use `eval`.
- Never use `new Function`.
- Never trust data files blindly.
- Validate JSON shape during build or app init.
- Keep API keys out of the repository.

If an external API is added, assume its key is public unless proxied by a backend.

Do not add private or paid API keys to frontend code.

---

## Performance Rules

Keep the main thread light.

Worker should handle expensive tasks.

Use lazy loading for images.

Use small JSON files split by domain.

Avoid loading every heavy feature on first paint.

Use dynamic imports for pages if the project grows.

Recommended initial loading:

```txt
main shell
router
current page component
worker init
minimal data required for current page
```

For large lists, use pagination or virtualization.

---

## Testing Rules

Use Vitest for logic.

Required test areas:

- Stone calculator.
- Divine Book calculator.
- Equipment material aggregation.
- Dusk drop filtering.
- Search normalization.
- JSON schema validation.
- Worker message handlers.

Do not test Tailwind classes unless they represent required UI state.

Prioritize calculation correctness.

---

## Code Style

Use TypeScript.

Use explicit types for:

- Worker messages.
- JSON models.
- Calculator inputs.
- Calculator outputs.
- Store state.

Prefer:

```ts
const value = ...
```

Avoid:

```ts
var value = ...
```

Use pure functions for business logic.

Avoid large files.

Avoid mixing UI, data, and calculations in the same module.

---

## Naming Rules

Use English for code names.

Accept Portuguese for visible UI labels if the target audience is Brazilian.

Examples:

Good file names:

```txt
DuskDropsPage.ts
DivineBooksPage.ts
stone-calculator.ts
equipment-materials.ts
```

Good IDs:

```txt
item-dust-of-devil
dusk-1-1
equipment-arcane-weapon-90
```

Avoid accented characters in IDs and file names.

---

## Commit Rules

Use clear commits.

Examples:

```txt
feat: add dusk drops page
feat: add stone calculator worker
fix: escape item names before rendering
test: cover equipment material aggregation
docs: add project agent guidelines
```

---

## Development Commands

Recommended scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "lint:data": "tsx scripts/validate-data.ts"
  }
}
```

---

## Agent Workflow

When modifying this project, follow this order:

1. Understand the feature.
2. Identify whether it belongs to UI, Worker, data, or tests.
3. Update data models if needed.
4. Implement pure logic first.
5. Add or update Worker handlers.
6. Connect UI through Worker client.
7. Escape all dynamic HTML output.
8. Add tests for calculations/search.
9. Confirm GitHub Pages compatibility.
10. Update documentation when behavior changes.

---

## Non-Goals

Do not turn this project into a full backend app.

Do not add authentication.

Do not add user accounts.

Do not require a database server.

Do not make calculations depend on external APIs.

Do not add frameworks unless there is a strong reason.

---

## Final Decision

Use this architecture:

```txt
Vite + TypeScript + Tailwind + LiteDom + Web Worker + JSON
```

LiteDom owns the interface.

Worker owns the heavy logic.

JSON owns the data.

GitHub Pages owns the hosting.
