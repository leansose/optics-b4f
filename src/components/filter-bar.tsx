"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { FilterDropdown } from "@/components/filter-dropdown";
import { MODELS, SHOPS, YEARS } from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import { useI18n } from "@/lib/i18n";

export function FilterBar() {
  const { filters, setFilters, reset, active } = useFilters();
  const { t } = useI18n();

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-2 px-4 py-2 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:px-5 lg:px-8">
        <span className="col-span-2 flex items-center gap-2 text-[13px] font-medium text-ink sm:col-span-1">
          <SlidersHorizontal
            size={15}
            aria-hidden="true"
            className="text-muted"
          />
          {t("common.filters")}
        </span>
        <FilterDropdown<number | null>
          label={t("common.shop")}
          value={filters.shop}
          onChange={(shop) => setFilters({ shop })}
          options={[
            { label: t("common.all"), value: null },
            ...SHOPS.map((s, i) => ({ label: s.name, value: i })),
          ]}
          className="w-full sm:w-44"
        />
        <FilterDropdown<number | null>
          label={t("common.year")}
          value={filters.year}
          onChange={(year) => setFilters({ year })}
          options={[
            { label: t("common.all"), value: null },
            ...YEARS.map((y) => ({ label: String(y), value: y })),
          ]}
          className="w-full sm:w-32"
        />
        <FilterDropdown<number | null>
          label={t("common.models")}
          value={filters.model}
          onChange={(model) => setFilters({ model })}
          options={[
            { label: t("common.all"), value: null },
            ...MODELS.map((m) => ({ label: m.label, value: m.id })),
          ]}
          className="col-span-2 w-full sm:col-span-1 sm:w-52"
        />
        <button
          type="button"
          onClick={reset}
          disabled={!active}
          className="flex min-h-9 items-center gap-1.5 rounded-[var(--control-radius)] border border-line px-2.5 py-1.5 text-[13px] text-brand-ink transition-colors hover:border-brand hover:bg-brand-soft/50 disabled:border-transparent disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent sm:min-h-8"
        >
          <RotateCcw size={14} aria-hidden="true" />
          {t("common.reset")}
        </button>
      </div>
    </div>
  );
}
