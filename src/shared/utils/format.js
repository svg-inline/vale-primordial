import { getLanguage } from "../i18n/index.js";

export function formatNumber(value, lang = getLanguage()) {
  return new Intl.NumberFormat(lang).format(value);
}

export function formatCurrency(value, lang = getLanguage(), currency = "BRL") {
  return new Intl.NumberFormat(lang, {
    style: "currency",
    currency
  }).format(value);
}
