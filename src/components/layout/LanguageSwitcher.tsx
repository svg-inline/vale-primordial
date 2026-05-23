"use client";

import { usePathname, useRouter } from "next/navigation";
import { isAppLocale, supportedLocales, useAppStore } from "@/stores/app.store";
import { Select } from "@/components/ui";

const localeLabels: Record<(typeof supportedLocales)[number], string> = {
  "pt-BR": "Português",
  "en-US": "English",
  "es-ES": "Español",
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  return (
    <Select
      id="language"
      label="Idioma"
      value={readLocaleFromPath(pathname) ?? language}
      onChange={(event) => {
        if (!isAppLocale(event.target.value)) {
          return;
        }

        setLanguage(event.target.value);
        router.replace(buildLocalizedPath(pathname, event.target.value));
      }}
      options={supportedLocales.map((locale) => ({
        label: localeLabels[locale],
        value: locale,
      }))}
    />
  );
}

function readLocaleFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];

  return segment && isAppLocale(segment) ? segment : null;
}

function buildLocalizedPath(pathname: string, locale: (typeof supportedLocales)[number]) {
  const segments = pathname.split("/").filter(Boolean);
  const pathSegments = segments[0] && isAppLocale(segments[0]) ? segments.slice(1) : segments;
  const basePath = `/${pathSegments.join("/")}`.replace(/\/$/, "") || "/";

  if (locale === "pt-BR") {
    return basePath;
  }

  return basePath === "/" ? `/${locale}` : `/${locale}${basePath}`;
}
