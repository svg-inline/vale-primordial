import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";
import { Button } from "./Button.js";

const sizes = {
  sm: "app-modal__dialog--sm",
  md: "app-modal__dialog--md",
  lg: "app-modal__dialog--lg"
};

export function Modal({
  id,
  title,
  description = "",
  body = "",
  open = false,
  size = "md",
  closeLabel = "Fechar",
  actions = [],
  className = "",
  attrs = {}
} = {}) {
  return `
    <section
      id="${escapeHtml(id)}"
      class="${classNames("app-modal", open && "app-modal--open", className)}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${escapeHtml(id)}-title"
      ${description ? `aria-describedby="${escapeHtml(id)}-description"` : ""}
      ${open ? "" : "hidden"}
      ${attributes(attrs)}
    >
      <button type="button" class="app-modal__backdrop" aria-label="${escapeHtml(closeLabel)}" ${dataAttributes({ action: "closeModal", modalId: id })}></button>
      <div class="${classNames("app-modal__dialog", sizes[size] || sizes.md)}">
        <header class="app-modal__header">
          <div>
            <h2 id="${escapeHtml(id)}-title" class="app-modal__title">${escapeHtml(title)}</h2>
            ${description ? `<p id="${escapeHtml(id)}-description" class="app-modal__description">${escapeHtml(description)}</p>` : ""}
          </div>
          ${Button({
            label: closeLabel,
            variant: "ghost",
            size: "sm",
            action: "closeModal",
            data: { modalId: id },
            attrs: { "aria-label": closeLabel }
          })}
        </header>
        <div class="app-modal__body">${body}</div>
        ${
          actions.length
            ? `<footer class="app-modal__footer">${actions.map((action) => Button(action)).join("")}</footer>`
            : ""
        }
      </div>
    </section>
  `;
}
