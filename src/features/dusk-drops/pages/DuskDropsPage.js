import { t } from "../../../shared/i18n/index.js";
import { escapeHtml } from "../../../shared/utils/escape-html.js";

export function DuskDropsPage() {
  return `
    <section class="grid gap-3">
      <p class="app-muted text-sm font-bold uppercase tracking-[0.14em]">${escapeHtml(t("features.duskDrops.eyebrow"))}</p>
      <div>
        <h1 class="text-3xl font-black text-text sm:text-4xl">${escapeHtml(t("nav.dusk"))}</h1>
        <p class="app-muted mt-2 max-w-2xl">${escapeHtml(t("features.duskDrops.description"))}</p>
      </div>
    </section>
  `;
}
