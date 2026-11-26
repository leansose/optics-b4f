/**
 * Builds src/data/products.json from public/data/lentes/csv.
 *
 * The catalogue is joined with deduplicated orders and their production,
 * logistics and incident costs. It keeps the same rules as build-metrics.py:
 * exact duplicate order rows are removed, contribution uses the delivered
 * orders, and an incident is attached to an order by id_encomenda.
 *
 * Run from the project root: npm run build-products
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "public/data/lentes/csv");
const OUT = resolve(ROOT, "src/data/products.json");

const CELL_COLUMNS = [
  "orders",
  "delivered",
  "lensesOrdered",
  "lensesDelivered",
  "affected",
  "value",
  "production",
  "productionLens",
  "logistics",
  "incident",
  "negativeOrder",
  "negativeLens",
  "late",
];

function parseCsvLine(line) {
  const out = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ";" && !quoted) {
      out.push(value);
      value = "";
    } else {
      value += ch;
    }
  }
  out.push(value);
  return out;
}

function readCsv(name) {
  const text = readFileSync(resolve(CSV, name), "utf8").replace(/^\uFEFF/, "");
  const lines = text.trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
  });
}

function num(s) {
  const n = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function isoDate(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : null;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return (
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000
  );
}

const catalogue = readCsv("lentes_catalogo.csv").map((r) => ({
  id: r.id,
  model: r.modelo,
  category: r.categoria,
  treatment: r.tipo_tratamento,
  complexity: num(r.complexidade),
  basePrice: num(r.preco_base),
  baseCost: num(r.custo_base_estimado),
  productionDays: num(r.duracao_producao_dias),
}));

const shopIds = readCsv("oticas_parceiras.csv").map((r) => r.id);
const shopIndex = new Map(shopIds.map((id, i) => [id, i]));

const production = new Map();
for (const r of readCsv("producao.csv")) {
  production.set(r.id_encomenda, num(r.custo_real));
}
const logistics = new Map();
for (const r of readCsv("custos_logistica.csv")) {
  logistics.set(r.id_encomenda, num(r.custo));
}

const rawOrders = readCsv("encomendas_lentes.csv");
const seen = new Set();
const orders = [];
for (const r of rawOrders) {
  const key = Object.values(r).join("\u0001");
  if (seen.has(key)) continue;
  seen.add(key);
  orders.push(r);
}

const validOrders = new Set(orders.map((r) => r.id_encomenda));
const incidentCost = new Map();
const incidentOrders = new Set();
for (const r of readCsv("retrabalho_devolucoes.csv")) {
  if (!validOrders.has(r.id_encomenda)) continue;
  incidentOrders.add(r.id_encomenda);
  incidentCost.set(
    r.id_encomenda,
    (incidentCost.get(r.id_encomenda) ?? 0) + num(r.custo_estimado),
  );
}

const catalogueIndex = new Map(catalogue.map((p, i) => [p.id, i]));
const cells = new Map();
let totalLate = 0;

for (const r of orders) {
  const model = catalogueIndex.get(r.id_lente);
  const shop = shopIndex.get(r.id_otica);
  const date = isoDate(r.data_encomenda);
  if (model === undefined || shop === undefined || !date) continue;

  const year = Number(date.slice(0, 4));
  const key = `${model}:${shop}:${year}`;
  const cell = cells.get(key) ?? new Array(CELL_COLUMNS.length).fill(0);
  const qty = num(r.quantidade);
  const delivered = r.estado === "entregue";
  const c = Object.fromEntries(CELL_COLUMNS.map((name, i) => [name, i]));

  cell[c.orders] += 1;
  cell[c.lensesOrdered] += qty;
  if (incidentOrders.has(r.id_encomenda)) cell[c.affected] += 1;

  if (delivered) {
    const value = num(r.valor_total);
    const productionCost = production.get(r.id_encomenda) ?? 0;
    const logisticsCost = logistics.get(r.id_encomenda) ?? 0;
    const incidentCostOrder = incidentCost.get(r.id_encomenda) ?? 0;
    const contributionOrder =
      value - productionCost - logisticsCost - incidentCostOrder;
    const contributionLens =
      value - productionCost * qty - logisticsCost - incidentCostOrder;
    const delay = daysBetween(
      isoDate(r.data_entrega_prevista),
      isoDate(r.data_entrega_real),
    );

    cell[c.delivered] += 1;
    cell[c.lensesDelivered] += qty;
    cell[c.value] += value;
    cell[c.production] += productionCost;
    cell[c.productionLens] += productionCost * qty;
    cell[c.logistics] += logisticsCost;
    cell[c.incident] += incidentCostOrder;
    if (contributionOrder < 0) cell[c.negativeOrder] += 1;
    if (contributionLens < 0) cell[c.negativeLens] += 1;
    if (delay !== null && delay >= 2) {
      cell[c.late] += 1;
      totalLate += 1;
    }
  }
  cells.set(key, cell);
}

const money = new Set([
  "value",
  "production",
  "productionLens",
  "logistics",
  "incident",
]);
const rows = [...cells.entries()]
  .map(([key, cell]) => {
    const [model, shop, year] = key.split(":").map(Number);
    return [
      model,
      shop,
      year,
      ...cell.map((v, i) =>
        money.has(CELL_COLUMNS[i]) ? Math.round(v * 100) / 100 : v,
      ),
    ];
  })
  .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);

const totalOrders = rows.reduce((n, r) => n + r[3], 0);
if (totalOrders !== 51374 || totalLate !== 7466) {
  throw new Error(
    `Sanity check failed: orders=${totalOrders}, late=${totalLate}`,
  );
}

writeFileSync(
  OUT,
  `${JSON.stringify({ catalog: catalogue, cellColumns: CELL_COLUMNS, cells: rows })}\n`,
  "utf8",
);
console.log(
  `products: ${catalogue.length} lenses, ${rows.length} cells, ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`,
);
