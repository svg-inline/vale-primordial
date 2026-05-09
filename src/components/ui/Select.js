import Check from "lucide/dist/esm/icons/check.mjs";
import ChevronDown from "lucide/dist/esm/icons/chevron-down.mjs";
import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";
import { Icon } from "./Icon.js";
import { Field } from "./Input.js";

export function Select({
  id,
  name = id,
  label,
  options = [],
  value = "",
  placeholder = "",
  hint = "",
  error = "",
  required = false,
  disabled = false,
  open = false,
  action,
  optionAction = "selectOption",
  className = "",
  data = {},
  attrs = {}
} = {}) {
  const selectedOption = options.find((option) => String(option.value ?? option.id ?? "") === String(value));
  const selectedLabel = selectedOption?.label ?? selectedOption?.name ?? placeholder;
  const listboxId = `${id}-listbox`;

  return Field({
    id,
    label,
    hint,
    error,
    required,
    className,
    children: `
      <div class="${classNames("app-select", open && "app-select--open")}" data-select="${escapeHtml(id)}">
        <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${required ? "required" : ""}>
        <button
          id="${escapeHtml(id)}"
          type="button"
          class="app-select__trigger"
          role="combobox"
          aria-controls="${escapeHtml(listboxId)}"
          aria-expanded="${open ? "true" : "false"}"
          aria-haspopup="listbox"
          ${error ? 'aria-invalid="true"' : ""}
          aria-describedby="{{describedBy}}"
          ${dataAttributes({ action, selectId: id, ...data })}
          ${disabled ? "disabled" : ""}
          ${attributes(attrs)}
        >
          <span class="${selectedOption ? "app-select__value" : "app-select__placeholder"}">
            ${escapeHtml(selectedLabel || "")}
          </span>
          <span class="app-select__chevron">${Icon({ icon: ChevronDown })}</span>
        </button>
        <div id="${escapeHtml(listboxId)}" class="app-select__listbox" role="listbox" ${open ? "" : "hidden"}>
          ${options.map((option) => SelectOption({
            selectId: id,
            option,
            selected: String(option.value ?? option.id ?? "") === String(value),
            action: optionAction
          })).join("")}
        </div>
      </div>
    `
  });
}

export function SelectOption({ selectId, option, selected = false, action = "selectOption" } = {}) {
  const optionValue = option.value ?? option.id ?? "";
  const optionLabel = option.label ?? option.name ?? optionValue;

  return `
    <button
      type="button"
      class="app-select__option"
      role="option"
      aria-selected="${selected ? "true" : "false"}"
      ${dataAttributes({ action, selectId, value: optionValue })}
    >
      <span>${escapeHtml(optionLabel)}</span>
      ${selected ? `<span class="app-select__check">${Icon({ icon: Check })}</span>` : ""}
    </button>
  `;
}
