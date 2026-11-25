"use client";

import { useEffect, useState } from "react";

export type Language = "pt" | "en";
export type Theme = "light" | "dark";

export function usePreferences() {
  const [language, setLanguage] = useState<Language>("pt");
  const [theme, setTheme] = useState<Theme>("light");
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
  }, []);

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
