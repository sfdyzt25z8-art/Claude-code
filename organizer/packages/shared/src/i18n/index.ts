import en from "./en";
import ar from "./ar";
import es from "./es";

export const translations = { en, ar, es } as const;
export type SupportedLocale = keyof typeof translations;
export type TranslationDictionary = typeof en;

export function getTranslations(locale: string): TranslationDictionary {
  return translations[(locale in translations ? locale : "en") as SupportedLocale];
}

export { en, ar, es };
