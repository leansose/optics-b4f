"use client";

import { CalendarRange, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { FilterBar } from "@/components/filter-bar";
import { useI18n } from "@/lib/i18n";

export function PageShell({
  title,
  intro,
  children,
  decision,
  filters = true,
  actions,
  navigation,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  decision?: string;
  filters?: boolean;
  actions?: ReactNode;
  navigation?: ReactNode;
}) {
  const { locale } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6 px-4 pb-16 pt-8 sm:gap-7 sm:px-7 md:pt-11 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl leading-tight font-bold tracking-[-0.04em] md:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-3 max-w-[70ch] text-base leading-relaxed text-muted">
              {intro}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
            <CalendarRange className="size-4 text-green" aria-hidden="true" />
            {locale === "pt" ? "Jan 2024 — Dez 2025" : "Jan 2024 — Dec 2025"}
          </span>
        </div>
      </header>
      {navigation}
      {filters && <FilterBar />}
      {children}
      {decision && (
        <aside
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl bg-brand-soft p-5 leading-relaxed text-ink"
        >
          <Compass className="mt-1 size-5 shrink-0 text-green" />
          {decision}
        </aside>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-line bg-surface ${className.includes("p-0") ? "" : "p-5 sm:p-7"} ${className}`}
    >
      {title && (
        <h2
          className={`mb-4 font-display text-xl font-semibold tracking-tight ${className.includes("p-0") ? "px-5 pt-5" : ""}`}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
