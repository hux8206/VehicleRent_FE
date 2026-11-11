"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import viDict from "@/locales/vi.json";
import enDict from "@/locales/en.json";

export type Language = "vi" | "en";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, paramsOrDefault?: Record<string, any> | string, maybeDefault?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const dictionaries: Record<Language, Record<string, string>> = {
  vi: viDict as Record<string, string>,
  en: enDict as Record<string, string>,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vr_locale") as Language | null;
      if (stored === "vi" || stored === "en") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vr_locale", lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const t = (
    key: string,
    paramsOrDefault?: Record<string, any> | string,
    maybeDefault?: string
  ): string => {
    let defaultText: string | undefined;
    let params: Record<string, any> | undefined;

    if (typeof paramsOrDefault === "string") {
      defaultText = paramsOrDefault;
    } else if (typeof paramsOrDefault === "object" && paramsOrDefault !== null) {
      params = paramsOrDefault;
      defaultText = maybeDefault;
    }

    const dict = dictionaries[language] || dictionaries.vi;
    let text = dict[key] || dictionaries.vi[key] || defaultText || key;

    if (params && typeof text === "string") {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        text = text.replace(new RegExp(`{${paramKey}}`, "g"), String(paramVal));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
