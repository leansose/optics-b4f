import raw from "@/data/products.json";
import type { Filters } from "./cube";

export type Product = {
  id: string;
  model: string;
  category: string;
  treatment: string;
  complexity: number;
  basePrice: number;
  baseCost: number;
  productionDays: number;
};

type Measure =
  | "orders"
  | "delivered"
  | "lensesOrdered"
  | "lensesDelivered"
  | "affected"
  | "value"
  | "production"
  | "productionLens"
  | "logistics"
  | "incident"
  | "negativeOrder"
  | "negativeLens"
  | "late";

export type ProductRow = Product &
  Record<Measure, number> & {
    revenue: number;
    margin: number;
    incidentRate: number;
    lateRate: number;
    contributionOrder: number;
    contributionLens: number;
  };

const catalog = raw.catalog as Product[];
const columns = raw.cellColumns as Measure[];
const INDEX = Object.fromEntries(columns.map((c, i) => [c, i])) as Record<
  Measure,
  number
>;

const newMeasures = (): Record<Measure, number> =>
  Object.fromEntries(columns.map((c) => [c, 0])) as Record<Measure, number>;

/** Catalogue enriched with orders/costs for the current shop + year + model. */
export function productRows(filters: Filters): ProductRow[] {
  const selected = filters.model === null ? null : filters.model - 1;
  const catalogue =
    selected === null ? catalog : catalog.filter((_, i) => i === selected);
  const totals = catalogue.map((p) => ({
    product: p,
    measures: newMeasures(),
  }));

  for (const cell of raw.cells) {
    const [model, shop, year, ...values] = cell;
    if (filters.shop !== null && shop !== filters.shop) continue;
    if (filters.year !== null && year !== filters.year) continue;
    if (selected !== null && model !== selected) continue;

    const target = selected === null ? totals[model] : totals[0];
    if (!target) continue;
    for (const name of columns) target.measures[name] += values[INDEX[name]];
  }

  return totals.map(({ product, measures: m }) => {
    const contributionOrder = m.value - m.production - m.logistics - m.incident;
    const contributionLens =
      m.value - m.productionLens - m.logistics - m.incident;
    return {
      ...product,
      ...m,
      revenue: m.value,
      margin: product.basePrice
        ? (product.basePrice - product.baseCost) / product.basePrice
        : 0,
      incidentRate: m.orders ? m.affected / m.orders : 0,
      lateRate: m.delivered ? m.late / m.delivered : 0,
      contributionOrder,
      contributionLens,
    } as ProductRow;
  });
}

export const CATEGORIES = [...new Set(catalog.map((p) => p.category))].sort();
export const TREATMENTS = [...new Set(catalog.map((p) => p.treatment))].sort();
export const COMPLEXITIES = [...new Set(catalog.map((p) => p.complexity))].sort(
  (a, b) => a - b,
);
