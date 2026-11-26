import type {
  Incident,
  Lens,
  Network,
  Order,
  OrderExample,
  Production,
  Scenario,
  Segment,
  Shipping,
  Shop,
  Totals,
} from "@/types";

export const number = (v: number, digits = 0) =>
  v.toLocaleString("pt-PT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
export const money = (cents: number) => `${number(cents / 100, 2)} €`;
const cents = (n: number) => Math.round(n * 100);
export const emptyTotals = (): Totals => ({
  orders: 0,
  affected: 0,
  delivered: 0,
  delayed: 0,
  sales: 0,
  production: 0,
  perLens: 0,
  shipping: 0,
  incidentCost: 0,
  deliveredIncidentCost: 0,
});
export function sumSegments(rows: Segment[]): Totals {
  const totals = emptyTotals();
  for (const row of rows)
    for (const key of Object.keys(totals) as (keyof Totals)[])
      totals[key] += row.totals[key];
  return totals;
}
export const isPriority = (id: string) => /^L0(0[1-9]|1[0-2])$/.test(id);
export function prepareNetwork(
  orders: Order[],
  shops: Shop[],
  lenses: Lens[],
  production: Production[],
  shipping: Shipping[],
  incidents: Incident[],
  duplicates: number,
  convertedDates: number,
): Network {
  const prod = new Map(
    production.map((r) => [r.id_encomenda, cents(r.custo_real)]),
  );
  const ship = new Map(shipping.map((r) => [r.id_encomenda, cents(r.custo)]));
  const ids = new Set(orders.map((r) => r.id_encomenda));
  const orphans = incidents.filter((r) => !ids.has(r.id_encomenda));
  const costs = new Map<string, number>();
  for (const r of incidents)
    costs.set(
      r.id_encomenda,
      (costs.get(r.id_encomenda) ?? 0) + cents(r.custo_estimado),
    );
  const segments = new Map<string, Segment>();
  const operators = new Map<
    string,
    { operator: string; total: number; affected: number }
  >();
  const operatorByOrder = new Map(
    production.map((r) => [r.id_encomenda, r.operador]),
  );
  const reasons = new Map<string, number>();
  for (const incident of incidents) {
    if (!ids.has(incident.id_encomenda) || !isPriority(incident.id_lente))
      continue;
    const reason = incident.motivo?.trim().toLowerCase() || "Não registado";
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }
  let example: Network["example"] = null;
  const orderDetails: OrderExample[] = [];
  for (const o of orders) {
    const id = o.id_encomenda;
    const key = [o.id_otica, o.id_lente].join("/");
    const segment = segments.get(key) ?? {
      shop: o.id_otica,
      lens: o.id_lente,
      totals: emptyTotals(),
    };
    segments.set(key, segment);
    const t = segment.totals;
    const event = costs.get(id) ?? 0;
    const operator = operatorByOrder.get(id);
    if (operator && isPriority(o.id_lente)) {
      const row = operators.get(operator) ?? {
        operator,
        total: 0,
        affected: 0,
      };
      row.total++;
      row.affected += Number(costs.has(id));
      operators.set(operator, row);
    }
    t.orders++;
    t.affected += Number(costs.has(id));
    t.incidentCost += event;
    if (o.estado !== "entregue") continue;
    const p = prod.get(id),
      s = ship.get(id);
    if (p === undefined || s === undefined)
      throw new Error(`Custo em falta na encomenda ${id}`);
    const sales = cents(o.valor_total);
    const detail = {
      recordId: o.id,
      code: id,
      quantity: o.quantidade,
      sales,
      production: p,
      shipping: s,
      incident: event,
    };
    orderDetails.push(detail);
    t.delivered++;
    t.sales += sales;
    t.production += p;
    t.perLens += p * o.quantidade;
    t.shipping += s;
    t.deliveredIncidentCost += event;
    if (
      o.data_entrega_real &&
      Date.parse(o.data_entrega_real) - Date.parse(o.data_entrega_prevista) >=
        2 * 86400000
    )
      t.delayed++;
    if (id === "2024/000017") example = detail;
  }
  return {
    shops,
    lenses,
    segments: [...segments.values()],
    orphans,
    duplicates,
    convertedDates,
    example,
    orderDetails,
    reasons: [...reasons]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    operatorRates: [...operators.values()].sort((a, b) =>
      a.operator.localeCompare(b.operator),
    ),
  };
}
export function compareShops(network: Network) {
  const all = sumSegments(network.segments).orders;
  const weights = new Map(
    network.lenses.map((l) => [
      l.id,
      sumSegments(network.segments.filter((s) => s.lens === l.id)).orders / all,
    ]),
  );
  return network.shops
    .map((shop) => {
      const rows = network.segments.filter((s) => s.shop === shop.id);
      const t = sumSegments(rows);
      const adjusted = rows.reduce(
        (n, s) =>
          n +
          (s.totals.affected / s.totals.orders) * (weights.get(s.lens) ?? 0),
        0,
      );
      return {
        ...shop,
        ...t,
        observed: (100 * t.affected) / t.orders,
        adjusted: 100 * adjusted,
      };
    })
    .sort((a, b) => b.observed - a.observed);
}
export function simulate(rows: Segment[], s: Scenario) {
  const t = sumSegments(
    rows.filter(
      (r) =>
        (s.shop === "all" || r.shop === s.shop) &&
        (s.lens === "all" ||
          (s.lens === "priority" ? isPriority(r.lens) : s.lens === r.lens)),
    ),
  );
  const production = s.unit ? t.perLens : t.production;
  const base = t.sales - production - t.shipping - t.deliveredIncidentCost;
  const delta = Math.round(
    (t.sales * s.priceChange -
      production * s.productionChange +
      t.deliveredIncidentCost * s.reduction) /
      100,
  );
  return { base, delta, projected: base + delta, t };
}
