"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  const label = locale === "en" ? t("lang.toPortuguese") : t("lang.toEnglish");

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "pt" : "en")}
      aria-label={label}
      title={label}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1 rounded-[var(--control-radius)] border border-line bg-paper px-2 text-[11px] font-semibold tracking-wide text-muted transition-colors hover:border-brand hover:text-ink active:scale-95 sm:min-h-8"
    >
      <Languages size={14} aria-hidden="true" />
      <span>{locale === "en" ? "EN" : "PT"}</span>
    </button>
  );
}
