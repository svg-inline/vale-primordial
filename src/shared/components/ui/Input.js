import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";

export function Field({
  id,
  label,
  hint = "",
  error = "",
  required = false,
  className = "",
  children = ""
} = {}) {
  const hintId = hint ? `${id}-hint` : "";
  const errorId = error ? `${id}-error` : "";
  const descriptionIds = [hintId, errorId].filter(Boolean).join(" ");

  return `
    <div class="${classNames("app-field", className)}">
      <label class="app-field__label" for="${escapeHtml(id)}">
        ${escapeHtml(label)}
        ${required ? '<span aria-hidden="true">*</span>' : ""}
      </label>
      ${children.replace("{{describedBy}}", descriptionIds)}
      ${hint ? `<p id="${escapeHtml(hintId)}" class="app-field__hint">${escapeHtml(hint)}</p>` : ""}
      ${error ? `<p id="${escapeHtml(errorId)}" class="app-field__error">${escapeHtml(error)}</p>` : ""}
    </div>
  `;
}

export function Input({
  id,
  name = id,
  label,
  type = "text",
  value = "",
  placeholder = "",
  hint = "",
  error = "",
  required = false,
  disabled = false,
  action,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  return Field({
    id,
    label,
    hint,
    error,
    required,
    className,
    children: `
      <input
        id="${escapeHtml(id)}"
        name="${escapeHtml(name)}"
        type="${escapeHtml(type)}"
        class="app-input"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(placeholder)}"
        ${dataAttributes({ action, ...data })}
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${error ? 'aria-invalid="true"' : ""}
        aria-describedby="{{describedBy}}"
        ${attributes(attrs)}
      >
    `
  });
}

export function Textarea({
  id,
  name = id,
  label,
  value = "",
  placeholder = "",
  hint = "",
  error = "",
  required = false,
  disabled = false,
  rows = 4,
  action,
  className = "",
  data = {},
  attrs = {}
} = {}) {
  return Field({
    id,
    label,
    hint,
    error,
    required,
    className,
    children: `
      <textarea
        id="${escapeHtml(id)}"
        name="${escapeHtml(name)}"
        class="app-input app-textarea"
        placeholder="${escapeHtml(placeholder)}"
        rows="${escapeHtml(rows)}"
        ${dataAttributes({ action, ...data })}
        ${required ? "required" : ""}
        ${disabled ? "disabled" : ""}
        ${error ? 'aria-invalid="true"' : ""}
        aria-describedby="{{describedBy}}"
        ${attributes(attrs)}
      >${escapeHtml(value)}</textarea>
    `
  });
}
