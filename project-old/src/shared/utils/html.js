import { escapeAttribute } from "./escape-html.js";

export function classNames(...values) {
  return values
    .flat(Infinity)
    .filter(Boolean)
    .join(" ");
}

export function dataAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([name, value]) => `data-${toKebabCase(name)}="${escapeAttribute(value)}"`)
    .join(" ");
}

export function booleanAttribute(name, value) {
  return value ? ` ${name}` : "";
}

export function optionalAttribute(name, value) {
  if (value === undefined || value === null || value === false || value === "") {
    return "";
  }

  if (value === true) {
    return ` ${name}`;
  }

  return ` ${name}="${escapeAttribute(value)}"`;
}

export function attributes(attributeMap = {}) {
  return Object.entries(attributeMap)
    .map(([name, value]) => optionalAttribute(name, value))
    .join("");
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}
