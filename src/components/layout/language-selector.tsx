"use client";

import React from "react";
import { Check, Globe } from "lucide-react";
import { useLanguage, Language } from "@/context/language-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages: { code: Language; label: string; flag: string; short: string }[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", short: "VI" },
  { code: "en", label: "English", flag: "🇬🇧", short: "EN" },
];

export function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="language-selector-btn"
          variant="outline"
          size="sm"
          className={`h-9 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs gap-1.5 font-bold text-xs cursor-pointer transition-colors ${className || ""}`}
          aria-label={t("language_title", "Ngôn ngữ")}
          title={t("language_title", "Ngôn ngữ")}
        >
          <span className="text-sm leading-none">{currentLang.flag}</span>
          <span className="text-xs font-bold tracking-wider">{currentLang.short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5 shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t("language_title", "Ngôn ngữ")}
        </div>
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded-lg cursor-pointer ${
                isSelected
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

