"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { CatalogueChart } from "@/components/catalogue-chart";
import { FilterDropdown } from "@/components/filter-dropdown";
import { Card, PageShell } from "@/components/page-shell";
import { Stat } from "@/components/stat";
import { useFilters } from "@/lib/filters";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORIES,
  COMPLEXITIES,
  type ProductRow,
  productRows,
  TREATMENTS,
} from "@/lib/products";

type SortKey =
  | "id"
  | "category"
  | "treatment"
  | "complexity"
  | "basePrice"
  | "baseCost"
  | "margin"
  | "orders"
  | "lensesDelivered"
  | "incidentRate"
  | "revenue"
  | "contributionOrder"
  | "contributionLens";

type Sort = { key: SortKey; dir: "asc" | "desc" };

type Column = {
  key: SortKey;
  label: string;
  hint?: string;
  align?: "right";
  render: (row: ProductRow) => ReactNode;
};

type Translator = ReturnType<typeof useI18n>["t"];
type ValueTranslator = ReturnType<typeof useI18n>["tv"];

const dash = "–";

function buildColumns(
  t: Translator,
  tv: ValueTranslator,
  { fmtInt, fmtUnits, fmtPct }: ReturnType<typeof useFormat>,
): Column[] {
  const catalogue = t("product.hint.catalogue");
  return [
    {
      key: "id",
      label: t("product.column.model"),
      render: (r) => (
        <span className="flex flex-col leading-tight">
          <span className="font-medium text-ink">{r.id}</span>
          <span className="text-xs text-muted">{r.model}</span>
        </span>
      ),
    },
    {
      key: "category",
      label: t("product.column.category"),
      render: (r) => <span className="text-ink">{tv(r.category)}</span>,
    },
    {
      key: "treatment",
      label: t("product.column.treatment"),
      render: (r) => (
        <span className="rounded-md bg-paper px-2 py-0.5 text-xs text-ink">
          {tv(r.treatment)}
        </span>
      ),
    },
    {
      key: "complexity",
      label: t("product.column.complexity"),
      align: "right",
      render: (r) => <span className="tabular-nums">{r.complexity}</span>,
    },
    {
      key: "basePrice",
      label: t("product.column.basePrice"),
      hint: catalogue,
      align: "right",
      render: (r) => (
        <span className="tabular-nums">{fmtUnits(r.basePrice, 2)}</span>
      ),
    },
    {
      key: "baseCost",
      label: t("product.column.baseCost"),
      hint: catalogue,
      align: "right",
      render: (r) => (
        <span className="tabular-nums">{fmtUnits(r.baseCost, 2)}</span>
      ),
    },
    {
      key: "margin",
      label: t("product.column.margin"),
      hint: catalogue,
      align: "right",
      render: (r) => (
        <span className="tabular-nums text-clear-ink">
          {fmtPct(r.margin, 0)}
        </span>
      ),
    },
    {
      key: "orders",
      label: t("common.orders"),
      align: "right",
      render: (r) => <span className="tabular-nums">{fmtInt(r.orders)}</span>,
    },
    {
      key: "lensesDelivered",
      label: t("product.column.lenses"),
      hint: t("product.hint.delivered"),
      align: "right",
      render: (r) => (
        <span className="tabular-nums">{fmtInt(r.lensesDelivered)}</span>
      ),
    },
    {
      key: "incidentRate",
      label: t("product.column.incidents"),
      hint: t("product.hint.shareOrders"),
      align: "right",
      render: (r) => (
        <span
          className={`tabular-nums ${r.incidentRate > 0.2 ? "text-signal-ink" : ""}`}
        >
          {r.orders ? fmtPct(r.incidentRate) : dash}
        </span>
      ),
    },
    {
      key: "revenue",
      label: t("product.column.revenue"),
      hint: t("product.hint.delivered"),
      align: "right",
      render: (r) => (
        <span className="tabular-nums">
          {r.delivered ? fmtUnits(r.revenue) : dash}
        </span>
      ),
    },
    {
      key: "contributionOrder",
      label: t("product.column.contributionOrder"),
      align: "right",
      render: (r) => (
        <span
          className={`tabular-nums ${
            r.contributionOrder >= 0 ? "text-clear-ink" : "text-signal-ink"
          }`}
        >
          {r.delivered ? fmtUnits(r.contributionOrder) : dash}
        </span>
      ),
    },
    {
      key: "contributionLens",
      label: t("product.column.contributionLens"),
      align: "right",
      render: (r) => (
        <span
          className={`tabular-nums ${
            r.contributionLens >= 0 ? "text-clear-ink" : "text-signal-ink"
          }`}
        >
          {r.delivered ? fmtUnits(r.contributionLens) : dash}
        </span>
      ),
    },
  ];
}

export function ProductDashboard() {
  const { filters } = useFilters();
  const { t, tv } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [treatment, setTreatment] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "orders", dir: "desc" });

  const format = useFormat();
  const { fmtInt, fmtPct } = format;
  const columns = useMemo(() => buildColumns(t, tv, format), [t, tv, format]);
  const all = useMemo(() => productRows(filters), [filters]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);

    const filtered = all.filter((r) => {
      if (
        q &&
        !`${r.id} ${r.model} ${tv(r.category)} ${tv(r.treatment)} ${r.category} ${r.treatment}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (category !== null && r.category !== category) return false;
      if (treatment !== null && r.treatment !== treatment) return false;
      if (complexity !== null && r.complexity !== complexity) return false;
      if (min !== null && Number.isFinite(min) && r.basePrice < min)
        return false;
      if (max !== null && Number.isFinite(max) && r.basePrice > max)
        return false;
      return true;
    });

    const factor = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp =
        typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : Number(av) - Number(bv);
      return cmp ? cmp * factor : a.id.localeCompare(b.id);
    });
  }, [
    all,
    search,
    category,
    treatment,
    complexity,
    minPrice,
    maxPrice,
    sort,
    tv,
  ]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.orders += r.orders;
          acc.affected += r.affected;
          acc.avgMargin += r.margin;
          return acc;
        },
        { orders: 0, affected: 0, avgMargin: 0 },
      ),
    [rows],
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : {
            key,
            dir:
              key === "id" || key === "category" || key === "treatment"
                ? "asc"
                : "desc",
          },
    );
  }

  const localFiltersActive =
    search !== "" ||
    category !== null ||
    treatment !== null ||
    complexity !== null ||
    minPrice !== "" ||
    maxPrice !== "";

  function clearLocal() {
    setSearch("");
    setCategory(null);
    setTreatment(null);
    setComplexity(null);
    setMinPrice("");
    setMaxPrice("");
  }

  return (
    <PageShell intro={t("intro.product")} title={t("product.title")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          value={`${fmtInt(rows.length)} / ${fmtInt(all.length)}`}
          label={t("product.statShown")}
          note={t("product.statShownNote")}
        />
        <Stat
          value={fmtInt(totals.orders)}
          label={t("product.statOrders")}
          note={t("product.statOrdersNote")}
        />
        <Stat
          tone="clear"
          value={totals.orders ? fmtPct(totals.affected / totals.orders) : dash}
          label={t("production.statOrders")}
          note={t("product.statIncidentNote", {
            catalogue: t("common.catalogue"),
            margin: fmtPct(totals.avgMargin / (rows.length || 1), 0),
          })}
        />
      </div>

      <CatalogueChart rows={rows} />
      <Card
        title={t("product.title")}
        className="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      >
        <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:flex sm:flex-wrap sm:items-end">
          <label className="relative w-full min-w-0 sm:min-w-56 sm:flex-1 xl:max-w-xs">
            <span className="sr-only">{t("product.searchModels")}</span>
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("product.searchPlaceholder")}
              className="w-full min-h-11 rounded-lg border border-line bg-paper py-2 pr-3 pl-9 text-sm text-ink placeholder:text-muted"
            />
          </label>
          <FilterDropdown<string | null>
            label={t("product.column.category")}
            value={category}
            onChange={setCategory}
            options={[
              { label: t("common.all"), value: null },
              ...CATEGORIES.map((c) => ({ label: tv(c), value: c })),
            ]}
            className="w-full sm:w-40"
          />
          <FilterDropdown<string | null>
            label={t("product.column.treatment")}
            value={treatment}
            onChange={setTreatment}
            options={[
              { label: t("common.all"), value: null },
              ...TREATMENTS.map((item) => ({ label: tv(item), value: item })),
            ]}
            className="w-full sm:w-48"
          />
          <FilterDropdown<number | null>
            label={t("product.column.complexity")}
            value={complexity}
            onChange={setComplexity}
            options={[
              { label: t("common.all"), value: null },
              ...COMPLEXITIES.map((c) => ({ label: String(c), value: c })),
            ]}
            className="w-full sm:w-36"
          />
          <div className="flex items-center gap-2">
            <div className="flex min-h-11 items-center gap-1.5 rounded-[var(--control-radius)] border border-line bg-paper px-2.5 py-1.5 text-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-ink/25">
              <span className="text-xs text-muted">{t("product.price")}</span>
              <span className="sr-only">{t("product.minPrice")}</span>
              <input
                type="number"
                min={0}
                aria-label={t("product.minPrice")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={t("product.min")}
                className="w-14 bg-transparent tabular-nums text-ink outline-none placeholder:text-muted"
              />
              <span className="text-muted">–</span>
              <span className="sr-only">{t("product.maxPrice")}</span>
              <input
                type="number"
                min={0}
                aria-label={t("product.maxPrice")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={t("product.max")}
                className="w-14 bg-transparent tabular-nums text-ink outline-none placeholder:text-muted"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={clearLocal}
            disabled={!localFiltersActive}
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-brand-ink hover:bg-brand-soft disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <X size={14} aria-hidden="true" />
            {t("common.clear")}
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper/60 px-4 py-2 text-xs text-muted">
          <span className="flex items-center gap-2">
            <SlidersHorizontal size={13} aria-hidden="true" />
            {t("product.visible", {
              shown: fmtInt(rows.length),
              total: fmtInt(all.length),
              orders: fmtInt(totals.orders),
            })}
          </span>
          <span className="hidden sm:inline">{t("product.sortHint")}</span>
        </div>

        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[1420px] border-collapse text-sm">
            <caption className="sr-only">{t("product.caption")}</caption>
            <thead className="sticky top-0 z-10 bg-surface text-xs text-muted shadow-[0_1px_0_var(--line)]">
              <tr>
                {columns.map((col, i) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={`border-b border-line px-3 py-2 font-medium whitespace-nowrap ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${i === 0 ? "sticky left-0 z-20 bg-surface" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={`inline-flex items-center gap-1 hover:text-brand-ink ${
                          active ? "text-brand-ink" : ""
                        } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                        title={t("product.sortBy", {
                          label: col.label,
                          hint: col.hint ? ` (${col.hint})` : "",
                        })}
                      >
                        <span>{col.label}</span>
                        {active ? (
                          sort.dir === "asc" ? (
                            <ArrowUp size={12} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown
                            size={12}
                            aria-hidden="true"
                            className="opacity-40"
                          />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-brand-soft/40">
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2 whitespace-nowrap ${
                        col.align === "right" ? "text-right" : "text-left"
                      } ${i === 0 ? "sticky left-0 z-10 bg-surface" : ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center"
                  >
                    <p className="text-ink">{t("product.noMatch")}</p>
                    <button
                      type="button"
                      onClick={clearLocal}
                      className="mt-2 text-brand-ink underline underline-offset-2"
                    >
                      {t("product.clearTable")}
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <p className="border-t border-line px-4 py-2 text-xs text-muted">
          {t("product.footer", {
            count: fmtInt(all.length),
            catalogue: t("common.catalogue"),
          })}
        </p>
      </Card>
    </PageShell>
  );
}
