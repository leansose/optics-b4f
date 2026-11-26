import type { CSSProperties } from "react";

export const CHART = {
  brand: "var(--brand)",
  brandSoft: "var(--brand-soft)",
  brandInk: "var(--brand-ink)",
  signal: "var(--signal)",
  signalInk: "var(--signal-ink)",
  clear: "var(--clear)",
  clearInk: "var(--clear-ink)",
  neutral: "var(--neutral)",
  coating: "var(--coating)",
  line: "var(--line)",
  muted: "var(--muted)",
  ink: "var(--ink)",
  surface: "var(--surface)",
  paper: "var(--paper)",
};

export const CHART_TICK = {
  fill: CHART.muted,
  fontFamily: "var(--font-geist-sans)",
  fontSize: 12,
};

export const CHART_TOOLTIP: CSSProperties = {
  borderRadius: 10,
  border: `1px solid ${CHART.line}`,
  background: CHART.surface,
  boxShadow: "var(--card-shadow)",
  color: CHART.ink,
  fontSize: 12,
  fontVariantNumeric: "tabular-nums",
};
