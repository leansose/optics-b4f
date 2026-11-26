export const fmtInt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export const fmtUnits = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

export const fmtPct = (x: number, digits = 1) =>
  `${(x * 100).toFixed(digits)}%`;

export const fmtMillions = (n: number) => `${(n / 1e6).toFixed(2)}M`;

export const fmtSignedUnits = (n: number, digits = 2) =>
  `${n < 0 ? "−" : ""}${fmtUnits(Math.abs(n), digits)}`;

export const fmtDeltaUnits = (n: number, digits = 0) =>
  `${n >= 0 ? "+" : "−"}${fmtUnits(Math.abs(n), digits)}`;
