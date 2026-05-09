import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ptBR from "./locales/pt-BR.json";
import enUS from "./locales/en-US.json";
import esES from "./locales/es-ES.json";

export const supportedLanguages = ["pt-BR", "en-US", "es-ES"];
export const fallbackLanguage = "pt-BR";

export async function initI18n() {
  await i18next.use(LanguageDetector).init({
    fallbackLng: fallbackLanguage,
    supportedLngs: supportedLanguages,
    resources: {
      "pt-BR": { translation: ptBR },
      "en-US": { translation: enUS },
      "es-ES": { translation: esES }
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

  syncDocumentLanguage();

  return i18next;
}

export function t(key, options = {}) {
  return i18next.t(key, options);
}

export async function changeLanguage(lang) {
  await i18next.changeLanguage(lang);
  syncDocumentLanguage();

  return i18next.language;
}

export function getLanguage() {
  return i18next.resolvedLanguage || i18next.language || fallbackLanguage;
}

export { i18next as i18n };

function syncDocumentLanguage() {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = getLanguage();
}
