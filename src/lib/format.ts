/** Currency symbol shown next to every monetary amount in the UI. */
export const CURRENCY_SYMBOL = "€";

const DECIMAL_LOCALE = "en-US";

/** Plain number without a currency symbol (counts, percentages, scores). */
export const fmtDecimal = (n: number, digits = 0) =>
  n.toLocaleString(DECIMAL_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const fmtInt = (n: number) => fmtDecimal(n);

export const fmtUnits = (n: number, digits = 0) =>
  `${fmtDecimal(n, digits)} ${CURRENCY_SYMBOL}`;

export const fmtPct = (x: number, digits = 1) =>
  `${(x * 100).toFixed(digits)}%`;

export const fmtMillions = (n: number) =>
  `${(n / 1e6).toFixed(2)}M ${CURRENCY_SYMBOL}`;

export const fmtSignedUnits = (n: number, digits = 2) =>
  `${n < 0 ? "−" : ""}${fmtUnits(Math.abs(n), digits)}`;

export const fmtDeltaUnits = (n: number, digits = 0) =>
  `${n >= 0 ? "+" : "−"}${fmtUnits(Math.abs(n), digits)}`;
