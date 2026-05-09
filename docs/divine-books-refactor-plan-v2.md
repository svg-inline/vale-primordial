# Refactor v2 — Livros Divinos em arquitetura multi-feature

## Decisão

O refactor da feature **Livros Divinos** deve entrar como uma feature isolada dentro de uma arquitetura preparada para reunir os três sites em um único projeto.

Não portar como `src/pages/DivineBooksPage.js` + `src/workers/divine-books.js` soltos.

Portar como:

```txt
src/features/divine-books/
```

O resto fica em `src/shared/`.

---

## Motivo

A versão antiga funciona, mas mistura dados, DOM, estado, cálculo, filtros, árvore, presets e renderização em um único fluxo.

Problemas que precisam ser corrigidos no novo projeto:

1. `DATA` fica em JavaScript global.
2. Estado fica espalhado em variáveis globais.
3. Cálculo usa DOM e estado global indiretamente.
4. Render usa `innerHTML` com strings não escapadas.
5. Presets usam chave genérica `pw_presets`.
6. Livro duplicado com receitas diferentes não tem modelo explícito.
7. Aliases/typos de nomes quebram cálculo.
8. A feature não está preparada para conviver com Dusk, Equipamentos e Pedras.

---

## Estrutura nova

```txt
src/
├─ features/
│  ├─ divine-books/
│  │  ├─ components/
│  │  ├─ data/
│  │  ├─ pages/
│  │  ├─ stores/
│  │  ├─ worker/
│  │  └─ index.js
│  ├─ dusk-drops/
│  ├─ equipments/
│  └─ stones/
├─ shared/
│  ├─ components/
│  ├─ stores/
│  ├─ utils/
│  └─ worker/
├─ workers/
│  └─ data.worker.js
└─ app/
   ├─ router.js
   └─ routes.js
```

---

## Fonte antiga mapeada

### Dados

Antigo:

```txt
data.js
```

Novo:

```txt
src/features/divine-books/data/divine-books.json
```

Mudança principal:

```txt
Antes: abas com items aninhados
Depois: tabs + items + recipes
```

### Script

Antigo:

```txt
script.js
```

Novo:

```txt
src/features/divine-books/worker/divine-books.calculator.js
src/features/divine-books/worker/divine-books.handlers.js
src/features/divine-books/stores/divine-books.store.js
src/features/divine-books/pages/DivineBooksPage.js
src/features/divine-books/components/*.js
```

### CSS

Antigo:

```txt
style.css
```

Novo:

```txt
src/styles/main.css
src/styles/themes.css
Tailwind classes nos componentes
```

Reaproveitar visual como preset `classic` ou `arcane`, não copiar CSS inteiro.

---

## Modelo de dados novo

```json
{
  "schemaVersion": 1,
  "feature": "divine-books",
  "tabs": [],
  "items": [],
  "recipes": [],
  "aliases": {}
}
```

### Item

```json
{
  "id": "divine-book-poder-interno",
  "type": "divine-book",
  "name": "Poder Interno",
  "level": 1,
  "icon": "images/1-5.png",
  "effects": ["For +5"],
  "tabs": ["divine-books-tab-1"]
}
```

### Receita

```json
{
  "id": "recipe-divine-books-tab-1-poder-interno-1",
  "resultItemId": "divine-book-poder-interno",
  "resultQuantity": 1,
  "sourceTabId": "divine-books-tab-1",
  "materials": [
    {
      "itemId": "material-fragmentos-de-escrita-divina",
      "quantity": 3
    }
  ]
}
```

---

## Regra importante sobre receitas duplicadas

Alguns livros aparecem mais de uma vez em abas diferentes com receitas diferentes.

Exemplo:

```txt
Água Gentil
Uivo do Mar
Risada da Loucura
Bênçãos da Terra
```

No novo modelo:

```txt
1 item único
N receitas possíveis
```

A preferência de receita fica no store:

```js
recipePreferences: {
  "divine-book-agua-gentil": "recipe-divine-books-tab-6-agua-gentil-1"
}
```

---

## Correções de aliases obrigatórias

```txt
Espinho de Rosa      -> Espinhos de Rosa
Fonte do deserto     -> Fonte do Deserto
Risada de Loucura    -> Risada da Loucura
Frangância dos Céus  -> Fragrância dos Céus
```

Esses aliases entram no JSON e devem ser resolvidos antes de calcular.

---

## Estado novo

Antigo:

```js
localStorage.pw_owned
localStorage.pw_presets
```

Novo:

```js
localStorage["pw-helper:divine-books:v1"]
```

Formato:

```js
{
  owned: {
    "divine-book-poder-interno": 1,
    "material-fragmentos-de-escrita-divina": 20
  },
  treeProgressByRoot: {
    "divine-book-pan-gu": {
      "divine-book-pan-gu.0.1": true
    }
  },
  recipePreferences: {},
  presets: {},
  filters: {}
}
```

### Separação obrigatória

```txt
owned              = inventário global
node tree progress = progresso marcado só naquela árvore
recipePreferences  = receita escolhida para livros com múltiplas receitas
```

Não usar mais `@path|nome` no array de `owned`.

---

## Worker API

Todas as ações da feature passam pelo Worker.

```js
workerClient.send("divineBooks", "GET_INITIAL_STATE")
workerClient.send("divineBooks", "FILTER", payload)
workerClient.send("divineBooks", "GET_ITEM", payload)
workerClient.send("divineBooks", "CALCULATE_BASE_MATERIALS", payload)
workerClient.send("divineBooks", "BUILD_TREE", payload)
workerClient.send("divineBooks", "BUILD_LIST", payload)
workerClient.send("divineBooks", "CALCULATE_PROGRESS", payload)
```

Mensagem padrão:

```js
{
  feature: "divineBooks",
  action: "BUILD_TREE",
  payload: {
    itemId: "divine-book-pan-gu",
    owned: {},
    treeProgress: {},
    recipePreferences: {}
  }
}
```

---

## Router de features no Worker

```js
const routeWorkerMessage = createFeatureRouter({
  divineBooks: divineBooksHandlers,
  duskDrops: duskDropsHandlers,
  equipments: equipmentsHandlers,
  stones: stonesHandlers,
});
```

Cada feature registra seus handlers.

Não criar um Worker separado por feature no MVP.

---

## Componentes da feature

```txt
DivineBooksPage.js
DivineBookCard.js
DivineBookFilters.js
DivineBookTreeView.js
DivineBookMaterialsSummary.js
```

Esses componentes só renderizam UI.

Não calculam árvore.
Não filtram dados pesados.
Não acessam JSON direto.

---

## Shared reutilizável

```txt
shared/utils/escape-html.js
shared/utils/normalize-text.js
shared/utils/slugify.js
shared/stores/storage.js
shared/worker/feature-router.js
shared/worker/worker-client.js
```

Tudo que pode servir para Dusk, Equipamentos e Pedras fica em `shared`.

---

## Migração em fases

### Fase 1 — Base multi-feature

- Criar `src/features`.
- Criar `src/shared`.
- Criar router de Worker por feature.
- Mover worker atual para `src/workers/data.worker.js`.
- Preparar hash routes.

### Fase 2 — Dados dos Livros Divinos

- Converter `data.js` para JSON.
- Separar `items`, `recipes`, `tabs`.
- Corrigir aliases.
- Garantir IDs sem acento.
- Criar teste de integridade dos dados.

### Fase 3 — Cálculos puros

- Implementar cálculo de materiais base.
- Implementar desconto por inventário.
- Implementar árvore de criação.
- Implementar lista quantitativa.
- Implementar progresso percentual.
- Cobrir com Vitest.

### Fase 4 — Store local

- Criar storage versionado.
- Migrar `pw_owned` antigo, se necessário.
- Separar inventário global e progresso de árvore.
- Implementar presets por feature.

### Fase 5 — UI LiteDom/Tailwind

- Criar página de Livros Divinos.
- Criar filtros.
- Criar cards.
- Criar modal/drawer de detalhe.
- Criar árvore.
- Criar lista quantitativa.
- Criar painel de materiais restantes.

### Fase 6 — Integração com os outros sites

- Repetir o mesmo padrão para Dusk.
- Repetir para Equipamentos.
- Repetir para Pedras.
- Compartilhar busca, item card, filtros e storage.

---

## O que não deve ser feito

Não copiar o `script.js` antigo inteiro.

Não manter `DATA` global.

Não misturar cálculo dentro dos componentes.

Não usar `innerHTML` sem `escapeHtml`.

Não usar chave genérica de localStorage para todas as features.

Não criar estrutura `src/pages`, `src/components`, `src/workers` plana se o projeto vai reunir múltiplos sites.

---

## Critério de pronto

A feature está pronta quando:

- Dados vêm de JSON.
- UI não importa JSON direto.
- Cálculos rodam no Worker.
- Store é versionada.
- Árvore e lista quantitativa retornam do Worker.
- Componentes escapam strings dinâmicas.
- Tests cobrem cálculo base, aliases, duplicatas e progresso.
- Rota `/#/divine-books` funciona no GitHub Pages.
