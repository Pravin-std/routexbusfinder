import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { en } from "@/i18n/en";
import { ta } from "@/i18n/ta";

type Language = "en" | "ta";
type Translations = typeof en;

interface LanguageContextType {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const translations: Record<Language, Translations> = { en, ta };

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(
    () => (localStorage.getItem("tn-bus-lang") as Language) || "en"
  );

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("tn-bus-lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "ta" : "en");
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
