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
│  │  ├─ router.js
│  │  ├─ routes.js
│  │  └─ bootstrap.js
│  ├─ components/
│  │  ├─ AppShell.js
│  │  ├─ ItemCard.js
│  │  ├─ SearchInput.js
│  │  ├─ FilterSelect.js
│  │  ├─ MaterialList.js
│  │  └─ CalculatorResult.js
│  ├─ data/
│  │  ├─ items.json
│  │  ├─ dusk-drops.json
│  │  ├─ equipments.json
│  │  ├─ divine-books.json
│  │  └─ stones.json
│  ├─ pages/
│  │  ├─ HomePage.js
│  │  ├─ DuskDropsPage.js
│  │  ├─ EquipmentsPage.js
│  │  ├─ DivineBooksPage.js
│  │  └─ StonesPage.js
│  ├─ stores/
│  │  ├─ app.store.js
│  │  ├─ filters.store.js
│  │  └─ calculator.store.js
│  ├─ i18n/
│  │  ├─ index.js
│  │  └─ locales/
│  │     ├─ pt-BR.json
│  │     ├─ en-US.json
│  │     └─ es-ES.json
│  ├─ workers/
│  │  ├─ data.worker.js
│  │  ├─ worker-client.js
│  │  ├─ search.js
│  │  ├─ filters.js
│  │  └─ calculators.js
│  ├─ schemas/
│  │  ├─ item.schema.js
│  │  ├─ dusk.schema.js
│  │  ├─ equipment.schema.js
│  │  ├─ divine-book.schema.js
│  │  └─ stone.schema.js
│  ├─ utils/
│  │  ├─ escape-html.js
│  │  ├─ format.js
│  │  └─ normalize.js
│  ├─ styles/
│  │  ├─ main.css
│  │  ├─ themes.css
│  │  └─ style-presets.js
│  └─ main.js
├─ tests/
│  ├─ calculators/
│  ├─ search/
│  └─ data/
├─ index.html
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
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

```js
component("#app", () => {
  return `
    <main class="app">
      ...
    </main>
  `;
});
```

Use delegated actions where possible:

```js
component("#app", renderPage)
  .on("search", handleSearch)
  .on("clearFilters", handleClearFilters);
```

### Dangerous LiteDom usage

Avoid injecting raw JSON values directly into HTML.

Bad:

```js
return `<h2>${item.name}</h2>`;
```

Good:

```js
return `<h2>${escapeHtml(item.name)}</h2>`;
```

Because LiteDom renders through `innerHTML`, all dynamic strings from JSON or user input must be escaped.

---

## Custom Component Rules

Prefer existing custom components over native HTML elements when a matching project component exists.

Examples:

- Use `SearchInput` instead of repeating raw search input markup.
- Use `FilterSelect` instead of creating one-off filter `<select>` markup.
- Use `MaterialList` instead of duplicating material list rendering.
- Use `CalculatorResult` instead of building calculator result blocks inline.

If no suitable custom component exists, create a reusable component in `src/components/` before adding repeated UI markup directly to a page.

Custom components must follow the project patterns:

- Render with LiteDom-compatible string output.
- Escape all dynamic JSON or user-provided strings before inserting them into HTML.
- Keep visible labels and accessibility text translation-ready through `t(...)`.
- Use Tailwind classes and semantic CSS variables from the active style preset.
- Use Lucide icons through the shared `Icon` renderer when an icon is needed.
- Keep component logic UI-only; data processing, filtering, search, and calculations stay in the Worker.
- Prefer small, focused props and stable object shapes.
- Remain keyboard accessible and use semantic HTML for interactive elements.

Do not create page-specific duplicate components when a shared component can cover the same interaction with clear props.

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

Use structured message objects.

Example:

```js
{ type: "INIT" }
{ type: "SEARCH_ITEMS", query: "dust" }
{ type: "FILTER_DUSK", filters: duskFilters }
{ type: "CALCULATE_EQUIPMENT", equipmentIds: ["equipment-example"] }
{
  type: "CALCULATE_DIVINE_BOOK",
  bookId: "divine-book-example",
  owned: { "item-page-example": 10 }
}
{
  type: "CALCULATE_STONES",
  fromLevel: 1,
  toLevel: 5,
  quantity: 2
}
```

Responses must also use predictable shapes:

```js
{ type: "READY" }
{ type: "SEARCH_ITEMS_RESULT", items: [] }
{ type: "FILTER_DUSK_RESULT", results: [] }
{ type: "CALCULATION_RESULT", result: calculationResult }
{ type: "ERROR", message: "Something went wrong" }
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

```js
calculateStoneCost(input, stoneTable);
```

Bad:

```js
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

Use Lucide icons for interface icons.

Install icons from the `lucide` package and prefer individual icon imports so Vite does not traverse the entire icon barrel:

```js
import Search from "lucide/dist/esm/icons/search.mjs";
import X from "lucide/dist/esm/icons/x.mjs";
```

When rendering icons from LiteDom string components, use the shared UI icon renderer instead of inline SVG strings or text symbols:

```js
import { Icon } from "./components/ui/Icon.js";

Icon({ icon: Search })
```

Prefer Lucide icons inside icon buttons, select chevrons, selected-state checks, dropdown actions, tabs, toggles, and modal close buttons whenever an icon exists.

Avoid:

- Text symbols for UI icons such as `✓`, `×`, `⌕`, `≡`, arrows, or chevrons.
- Hand-written SVG icons inside components.
- Duplicating the same SVG markup across components.

Recommended visual direction:

- Dark theme by default.
- Game helper/dashboard style.
- Clear cards.
- Strong contrast.
- Readable tables.
- Compact filters.
- Mobile-friendly calculators.

---

## Style Preset Rules

The app must be easy to restyle.

There will be a style dropdown later, so visual themes must be implemented as selectable style presets.

Use a stable style preset ID such as:

```txt
dark
arcane
classic
high-contrast
```

The default style preset is `dark`.

Store the selected preset in UI state and local preferences.

Apply the active preset to the document root:

```js
document.documentElement.dataset.stylePreset = selectedPreset;
```

Prefer semantic CSS variables for colors, surfaces, borders, shadows, and focus rings:

```css
:root,
[data-style-preset="dark"] {
  --color-page: #080b12;
  --color-surface: #111827;
  --color-text: #f8fafc;
  --color-muted: #94a3b8;
  --color-accent: #38bdf8;
  --color-border: #263244;
}

[data-style-preset="arcane"] {
  --color-page: #100a18;
  --color-surface: #1a1026;
  --color-text: #faf5ff;
  --color-muted: #c4b5fd;
  --color-accent: #f0abfc;
  --color-border: #3b2557;
}
```

Components should use semantic tokens instead of hardcoded palette choices whenever possible.

Prefer this:

```html
<section class="bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]">
```

Avoid this:

```html
<section class="bg-slate-900 text-slate-100 border-slate-700">
```

Keep layout, spacing, and component behavior stable across style presets.

Changing style must not change routing, worker data, calculations, filters, or translation logic.

The future style dropdown must use a real `<select>` or accessible menu button and must be keyboard accessible.

Style preset labels shown in the dropdown must come from the translation layer.

Do not duplicate whole components just to create a new visual style.

Add a new style preset by updating:

- `src/styles/themes.css`
- `src/styles/style-presets.js`
- Translation keys for the visible preset label

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

## Translation Rules

Code names must be written in English.

Visible game UI text must default to Brazilian Portuguese (`pt-BR`).

Use these libraries for app translation:

```txt
i18next
i18next-browser-languagedetector
```

Install them as runtime dependencies:

```bash
npm install i18next i18next-browser-languagedetector
```

Use native `Intl` APIs for number, currency, and date formatting:

```js
new Intl.NumberFormat("pt-BR").format(1500000);
new Intl.DateTimeFormat("pt-BR").format(new Date());
```

Do not add a separate formatting library for the MVP.

All user-facing strings must be translation-ready:

- Page titles.
- Navigation labels.
- Buttons.
- Form labels.
- Placeholders.
- Empty states.
- Error messages.
- Calculator result labels.
- Filter labels.
- Table headings.
- Accessibility labels.
- Meta descriptions.

Do not hardcode visible strings inside components when they can come from the translation layer.

Use stable English translation keys:

```js
t("nav.dusk")
t("filters.equipmentType")
t("calculator.missingMaterials")
```

Keep translation values in locale files such as:

```txt
src/i18n/locales/pt-BR.json
src/i18n/locales/en-US.json
src/i18n/locales/es-ES.json
```

The default locale is `pt-BR`.

Recommended `src/i18n/index.js` shape:

```js
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";

await i18next.use(LanguageDetector).init({
  fallbackLng: "pt-BR",
  supportedLngs: ["pt-BR", "en-US", "es-ES"],
  resources: {
    "pt-BR": { translation: ptBR },
    "en-US": { translation: enUS },
    "es-ES": { translation: esES }
  }
});

export const t = i18next.t;
export const i18n = i18next;
```

Example locale file:

```json
{
  "nav.dusk": "Drops Dusk",
  "nav.equipments": "Equipamentos",
  "nav.divineBooks": "Livros Divinos",
  "nav.stones": "Pedras",
  "search.placeholder": "Buscar item, boss ou equipamento"
}
```

Usage with LiteDom:

```js
import { t } from "../i18n/index.js";

component("#app", () => `
  <nav>
    <a href="#/dusk">${t("nav.dusk")}</a>
    <a href="#/equipments">${t("nav.equipments")}</a>
  </nav>
`);
```

The app should be able to receive additional translations without changing component logic.

Prefer this:

```js
buttonLabel: t("actions.search")
```

Avoid this:

```js
buttonLabel: "Buscar"
```

Game data names may stay in the source language used by the data file, but UI labels around them must use the translation layer.

When adding a new page, component, filter, calculation, or error state, add or update the corresponding translation keys.

Avoid `typesafe-i18n`, because it adds a typed translation workflow that does not fit this project.

Avoid Lingui, FormatJS, and `intl-messageformat` for the MVP unless plural, gender, or ICU MessageFormat support becomes a real product requirement.

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

Use JavaScript modules.

Use clear object shapes and validation for:

- Worker messages.
- JSON models.
- Calculator inputs.
- Calculator outputs.
- Store state.

Prefer:

```js
const value = ...
```

Avoid:

```js
var value = ...
```

Use pure functions for business logic.

Avoid large files.

Avoid mixing UI, data, and calculations in the same module.

---

## Naming Rules

Use English for code names.

Use English for file names, variable names, function names, IDs, translation keys, and internal constants.

Use Brazilian Portuguese only in translation values for the default `pt-BR` locale and other visible content intended for players.

Examples:

Good file names:

```txt
DuskDropsPage.js
DivineBooksPage.js
stone-calculator.js
equipment-materials.js
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
    "lint:data": "node scripts/validate-data.js"
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
Vite + JavaScript + Tailwind + LiteDom + Web Worker + JSON
```

LiteDom owns the interface.

Worker owns the heavy logic.

JSON owns the data.

GitHub Pages owns the hosting.
