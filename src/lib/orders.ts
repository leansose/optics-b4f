import raw from "@/data/orders.json";
import { type Filters, SHOPS } from "./cube";

/** code, shop index, year, model id, qty, value, production, logistics, incident */
export type OrderRow = readonly [
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

type OrdersJson = {
  fields: string[];
  rows: OrderRow[];
};

const ROWS = (raw as unknown as OrdersJson).rows;

export type OrderDetail = {
  code: string;
  shop: number;
  year: number;
  model: number;
  qty: number;
  value: number;
  production: number;
  logistics: number;
  incident: number;
};

export function modelLabel(model: number) {
  return `L${String(model).padStart(3, "0")}`;
}

export function decodeOrder(row: OrderRow): OrderDetail {
  return {
    code: row[0],
    shop: row[1],
    year: row[2],
    model: row[3],
    qty: row[4],
    value: row[5],
    production: row[6],
    logistics: row[7],
    incident: row[8],
  };
}

export function orderLabel(
  row: OrderRow,
  lensLabel = "lenses",
  unknownLabel = "Unknown",
) {
  return `${row[0]} · ${SHOPS[row[1]]?.name ?? unknownLabel} · ${modelLabel(row[3])} · ${row[4]} ${lensLabel}`;
}

/** Delivered orders matching the shared Shop / Year / Models filters. */
export function ordersFor(filters: Filters) {
  return ROWS.filter((row) => {
    if (filters.shop !== null && row[1] !== filters.shop) return false;
    if (filters.year !== null && row[2] !== filters.year) return false;
    if (filters.model !== null && row[3] !== filters.model) return false;
    return true;
  });
}

export function orderMatches(row: OrderRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row[0].toLowerCase().includes(q) ||
    (SHOPS[row[1]]?.name ?? "").toLowerCase().includes(q) ||
    modelLabel(row[3]).toLowerCase().includes(q) ||
    String(row[2]).includes(q)
  );
}
