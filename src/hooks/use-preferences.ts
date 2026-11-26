"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";

export type Language = "pt" | "en";
export type Theme = "light" | "dark";

const useSettings = create<{
  language: Language;
  theme: Theme;
  setLanguage: (v: Language) => void;
  setTheme: (v: Theme) => void;
}>((set) => ({
  language: "pt",
  theme: "light",
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
export function usePreferences() {
  const { language, theme, setLanguage, setTheme } = useSettings();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("opticmizer-language");
      const savedTheme = localStorage.getItem("opticmizer-theme");
      if (savedLanguage === "pt" || savedLanguage === "en")
        setLanguage(savedLanguage);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {
      // The controls still work when browser storage is unavailable.
    }
    setReady(true);
  }, [setLanguage, setTheme]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language === "pt" ? "pt-PT" : "en";
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("opticmizer-language", language);
      localStorage.setItem("opticmizer-theme", theme);
    } catch {
      // Keep preferences in memory for this session.
    }
  }, [language, theme, ready]);

  return { language, setLanguage, theme, setTheme };
}
