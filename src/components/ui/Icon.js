import { escapeAttribute, escapeHtml } from "../../utils/escape-html.js";
import { attributes, classNames } from "../../utils/html.js";

const defaultIconAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

export function Icon({
  icon,
  label = "",
  size = 16,
  strokeWidth = 2,
  className = "",
  attrs = {}
} = {}) {
  if (!Array.isArray(icon)) {
    return "";
  }

  return `
    <svg
      ${attributes({
        ...defaultIconAttributes,
        width: size,
        height: size,
        "stroke-width": strokeWidth,
        class: classNames("app-icon", className),
        "aria-hidden": label ? false : "true",
        role: label ? "img" : false,
        "aria-label": label || false,
        ...attrs
      })}
    >${icon.map(renderIconNode).join("")}</svg>
  `;
}

function renderIconNode(node) {
  if (!Array.isArray(node)) {
    return "";
  }

  const [tagName, nodeAttributes = {}, children = []] = node;

  if (!/^[a-z][a-z0-9-]*$/i.test(tagName)) {
    return "";
  }

  return `<${escapeHtml(tagName)}${attributes(nodeAttributes)}>${children.map(renderIconNode).join("")}</${escapeAttribute(tagName)}>`;
}
