import { usePreferences } from "@/hooks/use-preferences";

function createFormatters(locale: string) {
  const decimals = [0, 1, 2].map(
    (digits) =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        useGrouping: true,
      }),
  );
  const euros = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    useGrouping: true,
  });
  const fmtUnits = (n: number, digits = 0) => decimals[digits].format(n);
  const fmtInt = (n: number) => fmtUnits(n);
  const fmtPct = (n: number, digits = 1) => `${fmtUnits(100 * n, digits)}%`;
  const fmtMillions = (n: number) =>
    Math.abs(n) >= 1e6
      ? `${fmtUnits(n / 1e6, 2)} M`
      : fmtUnits(n, Math.abs(n) < 100 ? 2 : 0);
  const fmtSignedUnits = (n: number, digits = 2) =>
    `${n < 0 ? "−" : ""}${fmtUnits(Math.abs(n), digits)}`;
  const fmtDeltaUnits = (n: number, digits = 0) =>
    `${n >= 0 ? "+" : "−"}${fmtUnits(Math.abs(n), digits)}`;
  const money = (cents: number) => euros.format(cents / 100);
  return {
    fmtInt,
    fmtUnits,
    fmtPct,
    fmtMillions,
    fmtSignedUnits,
    fmtDeltaUnits,
    money,
  };
}

const formats = {
  pt: createFormatters("pt-PT"),
  en: createFormatters("en-GB"),
};
export function useFormat() {
  return formats[usePreferences((state) => state.language)];
}
