import raw from "@/data/cube.json";
import modelRaw from "@/data/model-cube.json";

export type GroupId = 0 | 1 | 2;
export type Filters = {
  shop: number | null;
  year: number | null;
  model: number | null;
};

export const NO_FILTERS: Filters = {
  shop: null,
  year: null,
  model: null,
};
export const SHOPS = raw.shops;
export const YEARS = [2024, 2025] as const;
export const GROUP_LABELS = ["L001–L012", "L013–L020", "Other models"] as const;

const MODEL_ROWS = modelRaw.rows as number[][];
export const MODELS = [...new Set(MODEL_ROWS.map((r) => r[3]))]
  .sort((a, b) => a - b)
  .map((id) => ({ id, label: `L${String(id).padStart(3, "0")}` }));

export const MEASURES = raw.measures;
const OFFSET = 4; // shop, year, month, group/model
const M = Object.fromEntries(MEASURES.map((m, i) => [m, OFFSET + i]));

export type Agg = Record<string, number>;

const emptyAgg = (): Agg => Object.fromEntries(MEASURES.map((m) => [m, 0]));

function sourceRows(f: Filters) {
  return f.model === null ? raw.rows : MODEL_ROWS;
}

export function aggregate(f: Filters): Agg {
  const out = emptyAgg();
  for (const r of sourceRows(f)) {
    if (f.shop !== null && r[0] !== f.shop) continue;
    if (f.year !== null && r[1] !== f.year) continue;
    if (f.model !== null && r[3] !== f.model) continue;
    for (let i = 0; i < MEASURES.length; i++) {
      out[MEASURES[i]] += r[OFFSET + i];
    }
  }
  return out;
}

/** Aggregate one model group, ignoring any individual model filter. */
export function aggregateGroup(f: Filters, group: GroupId): Agg {
  const out = emptyAgg();
  for (const r of raw.rows) {
    if (r[3] !== group) continue;
    if (f.shop !== null && r[0] !== f.shop) continue;
    if (f.year !== null && r[1] !== f.year) continue;
    for (let i = 0; i < MEASURES.length; i++) {
      out[MEASURES[i]] += r[OFFSET + i];
    }
  }
  return out;
}

/** Orders per month (index 0 = Jan) for one year, respecting the shared filters. */
export function monthlyOrders(f: Filters, year: number): number[] {
  const out = new Array<number>(12).fill(0);
  for (const r of sourceRows(f)) {
    if (r[1] !== year) continue;
    if (f.shop !== null && r[0] !== f.shop) continue;
    if (f.model !== null && r[3] !== f.model) continue;
    out[r[2] - 1] += r[M.o];
  }
  return out;
}

export const groupOfModel = (n: number): GroupId =>
  n <= 12 ? 0 : n <= 20 ? 1 : 2;

/** Problem rate by model group; shop/year filters apply, model selection highlights a group. */
export function groupRates(f: Filters) {
  return ([0, 1, 2] as const).map((g) => {
    let orders = 0;
    let affected = 0;
    for (const r of raw.rows) {
      if (f.shop !== null && r[0] !== f.shop) continue;
      if (f.year !== null && r[1] !== f.year) continue;
      if (r[3] !== g) continue;
      orders += r[M.o];
      affected += r[M.a];
    }
    return { group: g, orders, affected, rate: orders ? affected / orders : 0 };
  });
}

/** Observed and model-mix-adjusted rate for every shop (ignores the shop filter). */
export function shopRates(f: Filters) {
  const nets = new Map<number, number>();
  for (const r of raw.shopModel) {
    if (f.year !== null && r[1] !== f.year) continue;
    if (f.model !== null && r[2] !== f.model) continue;
    nets.set(r[2], (nets.get(r[2]) ?? 0) + r[3]);
  }
  const netTotal = [...nets.values()].reduce((a, b) => a + b, 0);

  return SHOPS.map((s, i) => {
    const obs = aggregate({ ...f, shop: i });
    const cells = new Map<number, { o: number; a: number }>();
    for (const r of raw.shopModel) {
      if (r[0] !== i) continue;
      if (f.year !== null && r[1] !== f.year) continue;
      if (f.model !== null && r[2] !== f.model) continue;
      const c = cells.get(r[2]) ?? { o: 0, a: 0 };
      c.o += r[3];
      c.a += r[4];
      cells.set(r[2], c);
    }
    let num = 0;
    let wsum = 0;
    for (const [model, c] of cells) {
      if (!c.o) continue;
      const w = (nets.get(model) ?? 0) / (netTotal || 1);
      num += w * (c.a / c.o);
      wsum += w;
    }
    return {
      shop: i,
      name: s.name,
      orders: obs.o,
      affected: obs.a,
      observed: obs.o ? obs.a / obs.o : 0,
      adjusted: wsum ? num / wsum : 0,
    };
  });
}

export const DQ_COLS = raw.dqCols;
export function dqAggregate(f: Filters): Agg {
  const out: Agg = Object.fromEntries(DQ_COLS.map((c) => [c, 0]));
  for (const r of raw.dq) {
    if (f.shop !== null && r[0] !== f.shop) continue;
    if (f.year !== null && r[1] !== f.year) continue;
    for (let i = 0; i < DQ_COLS.length; i++) out[DQ_COLS[i]] += r[2 + i];
  }
  return out;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
