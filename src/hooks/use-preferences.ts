"use client";

import { useEffect } from "react";
import { create } from "zustand";

export type Language = "pt" | "en";
export type Theme = "light" | "dark";
type FontSize = 100 | 115 | 130;

export const usePreferences = create<{
  language: Language;
  theme: Theme;
  fontSize: FontSize;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
}>((set) => ({
  language: "pt",
  theme: "light",
  fontSize: 100,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
}));

export function useDocumentPreferences() {
  useEffect(() => {
    try {
      const language = localStorage.getItem("opticmizer-language");
      const theme = localStorage.getItem("opticmizer-theme");
      const fontSize = Number(localStorage.getItem("opticmizer-font-size"));
      usePreferences.setState({
        language: language === "en" ? "en" : "pt",
        theme: theme === "dark" ? "dark" : "light",
        fontSize: fontSize === 115 || fontSize === 130 ? fontSize : 100,
      });
    } catch {
      /* Preferences also work in memory. */
    }
    function apply({
      language,
      theme,
      fontSize,
    }: ReturnType<typeof usePreferences.getState>) {
      const root = document.documentElement;
      root.lang = language === "pt" ? "pt-PT" : "en";
      root.dataset.theme = theme;
      root.style.fontSize = `${fontSize}%`;
      try {
        localStorage.setItem("opticmizer-language", language);
        localStorage.setItem("opticmizer-theme", theme);
        localStorage.setItem("opticmizer-font-size", String(fontSize));
      } catch {
        /* Storage may be disabled by the browser. */
      }
    }
    apply(usePreferences.getState());
    return usePreferences.subscribe(apply);
  }, []);
}
