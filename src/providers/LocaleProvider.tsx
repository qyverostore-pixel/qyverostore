import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Language, type TranslationKey } from "@/i18n/translations";

type LocaleContextValue = {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
};
const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "qyvero-language";

function translate(language: Language, key: TranslationKey) {
  const [group, item] = key.split(".") as [keyof typeof translations.en, string];
  const value = translations[language][group] as Record<string, string>;
  return value?.[item] ?? (translations.en[group] as Record<string, string>)?.[item] ?? key;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") setLanguageState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.classList.toggle("rtl", language === "ar");
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);
  const value = useMemo(
    () => ({
      language,
      direction: language === "ar" ? ("rtl" as const) : ("ltr" as const),
      setLanguage,
      toggleLanguage: () => setLanguage(language === "en" ? "ar" : "en"),
      t: (key: TranslationKey) => translate(language, key),
    }),
    [language, setLanguage],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
