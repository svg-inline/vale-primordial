import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";
import { Icon } from "./Icon.js";

const variants = {
  primary: "app-button app-button--primary",
  secondary: "app-button app-button--secondary",
  ghost: "app-button app-button--ghost",
  danger: "app-button app-button--danger"
};

const sizes = {
  sm: "app-button--sm",
  md: "app-button--md",
  lg: "app-button--lg"
};

export function Button({
  label,
  type = "button",
  variant = "secondary",
  size = "md",
  action,
  disabled = false,
  icon = "",
  iconPosition = "start",
  showLabel = true,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  const safeIcon = icon ? `<span class="app-button__icon">${Icon({ icon })}</span>` : "";
  const safeLabel = `<span class="${showLabel ? "app-button__label" : "app-sr-only"}">${escapeHtml(label)}</span>`;
  const content = iconPosition === "end" ? `${safeLabel}${safeIcon}` : `${safeIcon}${safeLabel}`;
  const dataset = dataAttributes({ action, ...data });

  return `
    <button
      type="${escapeHtml(type)}"
      class="${classNames(variants[variant] || variants.secondary, sizes[size] || sizes.md, className)}"
      ${dataset}
      ${disabled ? "disabled" : ""}
      ${attributes(attrs)}
    >${content}</button>
  `;
}

export function LinkButton({
  label,
  href = "#",
  variant = "ghost",
  size = "md",
  current = false,
  icon = "",
  iconPosition = "start",
  showLabel = true,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  const safeIcon = icon ? `<span class="app-button__icon">${Icon({ icon })}</span>` : "";
  const safeLabel = `<span class="${showLabel ? "app-button__label" : "app-sr-only"}">${escapeHtml(label)}</span>`;
  const content = iconPosition === "end" ? `${safeLabel}${safeIcon}` : `${safeIcon}${safeLabel}`;
  const dataset = dataAttributes(data);

  return `
    <a
      href="${escapeHtml(href)}"
      class="${classNames(variants[variant] || variants.ghost, sizes[size] || sizes.md, className)}"
      ${current ? 'aria-current="page"' : ""}
      ${dataset}
      ${attributes(attrs)}
    >${content}</a>
  `;
}
