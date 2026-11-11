"use client";

import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { useLanguage } from "@/context/language-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();
  const { t } = useLanguage();

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/70 animate-pulse ${className || ""}`} />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          data-testid="theme-toggle-btn"
          variant="outline"
          size="sm"
          className={`h-9 w-9 p-0 rounded-xl border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer ${className || ""}`}
          aria-label={t("theme_title", "Giao diện")}
          title={t("theme_title", "Giao diện")}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-amber-400 transition-transform duration-300" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 shadow-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded-lg cursor-pointer ${
            theme === "light"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>{t("theme_light", "Sáng")}</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded-lg cursor-pointer ${
            theme === "dark"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-400" />
            <span>{t("theme_dark", "Tối")}</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded-lg cursor-pointer ${
            theme === "system"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-bold"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>{t("theme_system", "Hệ thống")}</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

