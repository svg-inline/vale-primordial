import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";

export function Toggle({
  id,
  label,
  pressed = false,
  variant = "secondary",
  disabled = false,
  action,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  return `
    <button
      id="${escapeHtml(id)}"
      type="button"
      class="${classNames("app-toggle", `app-toggle--${variant}`, pressed && "app-toggle--pressed", className)}"
      aria-pressed="${pressed ? "true" : "false"}"
      ${dataAttributes({ action, toggleId: id, ...data })}
      ${disabled ? "disabled" : ""}
      ${attributes(attrs)}
    >
      ${escapeHtml(label)}
    </button>
  `;
}

export function Switch({
  id,
  label,
  description = "",
  checked = false,
  disabled = false,
  action,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  const descriptionId = description ? `${id}-description` : "";

  return `
    <button
      id="${escapeHtml(id)}"
      type="button"
      class="${classNames("app-switch", checked && "app-switch--checked", className)}"
      role="switch"
      aria-checked="${checked ? "true" : "false"}"
      ${description ? `aria-describedby="${escapeHtml(descriptionId)}"` : ""}
      ${dataAttributes({ action, switchId: id, ...data })}
      ${disabled ? "disabled" : ""}
      ${attributes(attrs)}
    >
      <span class="app-switch__copy">
        <span class="app-switch__label">${escapeHtml(label)}</span>
        ${description ? `<span id="${escapeHtml(descriptionId)}" class="app-switch__description">${escapeHtml(description)}</span>` : ""}
      </span>
      <span class="app-switch__track" aria-hidden="true">
        <span class="app-switch__thumb"></span>
      </span>
    </button>
  `;
}
