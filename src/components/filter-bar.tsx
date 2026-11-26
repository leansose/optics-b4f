"use client";

import { ChevronDown, ListFilter, RotateCcw } from "lucide-react";
import { useState } from "react";
import { MODELS, SHOPS, YEARS } from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import { useI18n } from "@/lib/i18n";

export function FilterBar() {
  const { filters, setFilters, reset, active } = useFilters();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const pt = locale === "pt";
  const fields = [
    {
      key: "shop",
      label: t("common.shop"),
      all: pt ? "Todas as óticas" : "All opticians",
      options: SHOPS.map((s, i) => [i, s.name] as const),
    },
    {
      key: "year",
      label: t("common.year"),
      all: pt ? "2024 e 2025" : "2024 and 2025",
      options: YEARS.map((y) => [y, String(y)] as const),
    },
    {
      key: "model",
      label: pt ? "Modelo" : "Model",
      all: pt ? "Todos os modelos" : "All models",
      options: MODELS.map((m) => [m.id, m.label] as const),
    },
  ] as const;
  return (
    <fieldset className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-line bg-surface px-4 py-3 sm:px-5">
      <legend className="sr-only">{t("common.filters")}</legend>
      <button
        type="button"
        className="flex min-h-11 w-full items-center justify-between text-sm font-semibold sm:hidden"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="selection-filters"
      >
        <span>
          {t("common.filters")}
          {active
            ? " (" +
              Object.values(filters).filter((v) => v !== null).length +
              ")"
            : ""}
        </span>
        <ChevronDown size={16} />
      </button>
      <span className="hidden items-center gap-2 text-sm font-semibold sm:flex">
        <ListFilter className="size-4 text-green" aria-hidden="true" />
        {t("common.filters")}
      </span>
      <div
        id="selection-filters"
        className={
          (open ? "flex " : "hidden ") +
          "min-w-0 grow flex-wrap items-center gap-3 sm:flex"
        }
      >
        {fields.map(({ key, label, all, options }) => (
          <label
            key={key}
            className="flex min-w-0 grow items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 sm:grow-0"
          >
            <span className="text-sm text-muted">{label}</span>
            <select
              className="min-h-11 min-w-0 max-w-full cursor-pointer bg-transparent text-sm font-semibold"
              value={filters[key] ?? ""}
              onChange={(e) =>
                setFilters({
                  [key]: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            >
              <option value="">{all}</option>
              {options.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ))}
        {active && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-green sm:ml-auto"
          >
            <RotateCcw size={15} />
            {t("common.reset")}
          </button>
        )}
      </div>
    </fieldset>
  );
}
