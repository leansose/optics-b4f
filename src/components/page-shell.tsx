"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  step: number;
  title: string;
  decision?: string;
  children: ReactNode;
};

export function PageShell({ step, title, decision, children }: Props) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-5 lg:px-8">
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
          {title}
        </h1>
        <p className="text-xs tabular-nums text-muted">
          {t("common.stepOf", { current: step })}
        </p>
      </header>
      <div className="flex flex-1 flex-col gap-4 sm:gap-5">{children}</div>
      {decision ? (
        <footer
          aria-live="polite"
          className="rounded-[var(--card-radius)] border border-line border-l-[3px] border-l-coating bg-coating-soft px-4 py-2.5 leading-relaxed text-ink sm:px-5"
        >
          <span className="font-semibold text-brand-ink">
            {t("common.decision")}
          </span>{" "}
          {decision}
        </footer>
      ) : null}
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
      className={`rounded-[var(--card-radius)] border border-line bg-surface p-4 shadow-[var(--card-shadow)] ${className}`}
    >
      {title ? (
        <h2 className="mb-3 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
