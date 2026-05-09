import { escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames, dataAttributes } from "../../utils/html.js";
import { Button } from "./Button.js";

export function Dropdown({
  id,
  label,
  items = [],
  open = false,
  align = "start",
  variant = "secondary",
  className = "",
  attrs = {}
} = {}) {
  return `
    <div class="${classNames("app-dropdown", `app-dropdown--${align}`, className)}" data-dropdown="${escapeHtml(id)}" ${attributes(attrs)}>
      ${Button({
        label,
        variant,
        action: "toggleDropdown",
        data: { dropdownId: id },
        attrs: {
          "aria-expanded": open ? "true" : "false",
          "aria-haspopup": "menu",
          "aria-controls": `${id}-menu`
        }
      })}
      <div id="${escapeHtml(id)}-menu" class="app-dropdown__menu" role="menu" ${open ? "" : "hidden"}>
        ${items.map((item) => DropdownItem(item)).join("")}
      </div>
    </div>
  `;
}

export function DropdownItem({
  label,
  action,
  href,
  disabled = false,
  danger = false,
  data = {},
  attrs = {}
} = {}) {
  const itemClass = classNames("app-dropdown__item", danger && "app-dropdown__item--danger");
  const dataset = dataAttributes({ action, ...data });

  if (href) {
    return `
      <a href="${escapeHtml(href)}" class="${itemClass}" role="menuitem" ${dataset} ${attributes(attrs)}>
        ${escapeHtml(label)}
      </a>
    `;
  }

  return `
    <button type="button" class="${itemClass}" role="menuitem" ${dataset} ${disabled ? "disabled" : ""} ${attributes(attrs)}>
      ${escapeHtml(label)}
    </button>
  `;
}
