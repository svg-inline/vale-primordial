import "./styles/main.css";
import "./libs/litedom.js";
import { Button, Dropdown, Input, LinkButton, Modal, Select, Switch, Tabs, Textarea, Toggle } from "./components/ui/index.js";

const { component, useState } = globalThis;

component("#app", () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [equipmentType, setEquipmentType] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [activeTab, setActiveTab] = useState("filters");

  const equipmentOptions = [
    { value: "weapon", label: "Arma" },
    { value: "armor", label: "Armadura" },
    { value: "ornament", label: "Ornamento" }
  ];

  queueMicrotask(() => {
    document.querySelector("[data-action='openModal']")?.addEventListener("click", () => setModalOpen(true), { once: true });
    document.querySelectorAll("[data-action='closeModal']").forEach((element) => {
      element.addEventListener("click", () => setModalOpen(false), { once: true });
    });
    document.querySelector("[data-action='toggleDropdown']")?.addEventListener("click", () => setDropdownOpen(!dropdownOpen), { once: true });
    document.querySelector("[data-action='toggleSelect']")?.addEventListener("click", () => setSelectOpen(!selectOpen), { once: true });
    document.querySelectorAll("[data-action='selectEquipmentType']").forEach((element) => {
      element.addEventListener("click", () => {
        setEquipmentType(element.dataset.value ?? "");
        setSelectOpen(false);
      }, { once: true });
    });
    document.querySelector("[data-action='toggleFavorites']")?.addEventListener("click", () => setOnlyFavorites(!onlyFavorites), { once: true });
    document.querySelector("[data-action='toggleCompactMode']")?.addEventListener("click", () => setCompactMode(!compactMode), { once: true });
    document.querySelectorAll("[data-action='selectComponentTab']").forEach((element) => {
      element.addEventListener("click", () => setActiveTab(element.dataset.tabId ?? "filters"), { once: true });
    });
  });

  return `
    <main class="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header class="grid gap-3">
        <p class="app-muted text-sm font-bold uppercase tracking-[0.14em]">Perfect World Helper</p>
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 class="text-3xl font-black text-text sm:text-4xl">Componentes customizáveis</h1>
            <p class="app-muted mt-2 max-w-2xl">
              Base visual para ações, navegação, campos, filtros, menus e pop-ups do helper.
            </p>
          </div>
          <nav class="flex flex-wrap gap-2" aria-label="Navegação de exemplo">
            ${LinkButton({ label: "Início", href: "#/", current: true })}
            ${LinkButton({ label: "Drops Dusk", href: "#/dusk" })}
            ${LinkButton({ label: "Pedras", href: "#/stones" })}
          </nav>
        </div>
      </header>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">Button / Link</h2>
          <p class="app-muted mt-1 text-sm">Variações de ação com tamanho, intenção e estado.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          ${Button({ label: "Buscar", variant: "primary", icon: "⌕" })}
          ${Button({ label: "Filtrar", variant: "secondary", icon: "≡" })}
          ${Button({ label: "Limpar", variant: "ghost" })}
          ${Button({ label: "Remover", variant: "danger" })}
          ${Button({ label: "Desativado", disabled: true })}
        </div>
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">Inputs / Select</h2>
          <p class="app-muted mt-1 text-sm">Campos com label, ajuda, erro, required e atributos extras.</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          ${Input({
            id: "search",
            label: "Busca",
            placeholder: "Buscar item, boss ou equipamento",
            hint: "Use nomes de materiais, dungeons ou equipamentos."
          })}
          ${Select({
            id: "equipment-type",
            label: "Tipo de equipamento",
            placeholder: "Todos os tipos",
            value: equipmentType,
            open: selectOpen,
            action: "toggleSelect",
            optionAction: "selectEquipmentType",
            options: equipmentOptions
          })}
          ${Input({
            id: "quantity",
            label: "Quantidade",
            type: "number",
            value: "1",
            required: true,
            attrs: { min: 1 }
          })}
          ${Input({
            id: "invalid-example",
            label: "Exemplo com erro",
            value: "0",
            error: "Informe um valor maior que zero."
          })}
          <div class="md:col-span-2">
            ${Textarea({
              id: "notes",
              label: "Notas",
              placeholder: "Observações do cálculo"
            })}
          </div>
        </div>
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">Toggle / Switch / Tabs</h2>
          <p class="app-muted mt-1 text-sm">Controles próprios para preferências, modos e navegação interna.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          ${Toggle({
            id: "favorites-toggle",
            label: "Somente favoritos",
            pressed: onlyFavorites,
            action: "toggleFavorites"
          })}
          ${Switch({
            id: "compact-mode-switch",
            label: "Modo compacto",
            description: "Reduz espaçamento em listas e tabelas.",
            checked: compactMode,
            action: "toggleCompactMode"
          })}
        </div>
        ${Tabs({
          id: "component-tabs",
          activeId: activeTab,
          action: "selectComponentTab",
          tabs: [
            {
              id: "filters",
              label: "Filtros",
              content: '<p class="app-muted">Aba para controles de busca, dungeon, boss, classe e grade.</p>'
            },
            {
              id: "results",
              label: "Resultados",
              content: '<p class="app-muted">Aba para cards, tabelas e listas de materiais calculados.</p>'
            },
            {
              id: "history",
              label: "Histórico",
              content: '<p class="app-muted">Aba para cálculos recentes e preferências locais.</p>'
            }
          ]
        })}
      </section>

      <section class="app-surface grid gap-5 p-5">
        <div>
          <h2 class="text-xl font-extrabold">Dropdown / Modal</h2>
          <p class="app-muted mt-1 text-sm">Menus e pop-ups acessíveis com ações delegáveis.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          ${Dropdown({
            id: "actions-menu",
            label: "Ações",
            open: dropdownOpen,
            items: [
              { label: "Salvar filtro", action: "saveFilter" },
              { label: "Exportar lista", action: "exportList" },
              { label: "Excluir preset", action: "deletePreset", danger: true }
            ]
          })}
          ${Button({ label: "Abrir modal", variant: "primary", action: "openModal" })}
        </div>
      </section>

      ${Modal({
        id: "example-modal",
        title: "Confirmar cálculo",
        description: "Revise a ação antes de aplicar.",
        open: modalOpen,
        body: `
          <p class="app-muted">
            Este modal já aceita conteúdo HTML renderizado pelo componente chamador. Textos dinâmicos devem chegar escapados.
          </p>
        `,
        actions: [
          { label: "Cancelar", variant: "ghost", action: "closeModal", data: { modalId: "example-modal" } },
          { label: "Confirmar", variant: "primary", action: "closeModal", data: { modalId: "example-modal" } }
        ]
      })}
    </main>
  `;
});
