/**
 * Builds src/data/model-cube.json from public/data/lentes/csv.
 *
 * Same deduplication and measure formulas as scripts/build-metrics.py, but the
 * cube is grouped by shop / year / month / individual model (L001..L050)
 * instead of by model group. This lets the shared Models filter select one
 * model at a time without changing the original numbers.
 *
 * Run from the project root: npm run build-model-cube
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "public/data/lentes/csv");
const OUT = resolve(ROOT, "src/data/model-cube.json");
const CUBE = resolve(ROOT, "src/data/cube.json");

const MEASURES = [
  "o",
  "a",
  "ic",
  "d",
  "v",
  "p",
  "pl",
  "lg",
  "oc",
  "nO",
  "nL",
  "t0",
  "t1",
  "t2",
  "dd",
  "d2",
  "lowN",
  "lowNegO",
  "lowNegL",
  "sp",
  "sb",
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
      } else quoted = !quoted;
    } else if (ch === ";" && !quoted) {
      out.push(value);
      value = "";
    } else value += ch;
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

function date(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00Z`);
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`) : null;
}

const round2 = (n) => Math.round(n * 100) / 100;
const catalogue = readCsv("lentes_catalogo.csv");
const price = new Map(catalogue.map((r) => [r.id, num(r.preco_base)]));
const baseCost = new Map(
  catalogue.map((r) => [r.id, num(r.custo_base_estimado)]),
);
const shops = readCsv("oticas_parceiras.csv").map((r) => r.id);
const shopIndex = new Map(shops.map((id, i) => [id, i]));

const production = new Map();
for (const r of readCsv("producao.csv")) {
  production.set(r.id_encomenda, num(r.custo_real));
}
const logistics = new Map();
for (const r of readCsv("custos_logistica.csv")) {
  logistics.set(r.id_encomenda, num(r.custo));
}

const seen = new Set();
const orders = [];
for (const r of readCsv("encomendas_lentes.csv")) {
  const key = Object.values(r).join("\u0001");
  if (seen.has(key)) continue;
  seen.add(key);
  orders.push(r);
}
const valid = new Set(orders.map((r) => r.id_encomenda));
const incident = new Map();
const affected = new Set();
for (const r of readCsv("retrabalho_devolucoes.csv")) {
  if (!valid.has(r.id_encomenda)) continue;
  incident.set(
    r.id_encomenda,
    (incident.get(r.id_encomenda) ?? 0) + num(r.custo_estimado),
  );
  affected.add(r.id_encomenda);
}

function cell(g) {
  const del = g.filter((o) => o.delivered);
  const single = g.filter((o) => o.qty === 1);
  const sum = (rows, fn) => rows.reduce((n, o) => n + fn(o), 0);
  const delay = (o) => o.delay;
  return [
    g.length,
    g.filter((o) => o.affected).length,
    round2(sum(g, (o) => o.occ)),
    del.length,
    round2(sum(del, (o) => o.value)),
    round2(sum(del, (o) => o.prod)),
    round2(sum(del, (o) => o.prod * o.qty)),
    round2(sum(del, (o) => o.log)),
    round2(sum(del, (o) => o.occ)),
    del.filter((o) => o.contributionOrder < 0).length,
    del.filter((o) => o.contributionLens < 0).length,
    del.filter((o) => delay(o) === 0).length,
    del.filter((o) => delay(o) === 1).length,
    del.filter((o) => delay(o) >= 2).length,
    sum(
      del.filter((o) => delay(o) > 0),
      delay,
    ),
    sum(
      del.filter((o) => delay(o) >= 2),
      delay,
    ),
    g.filter((o) => o.low).length,
    g.filter((o) => o.low && o.contributionOrder < 0).length,
    g.filter((o) => o.low && o.contributionLens < 0).length,
    round2(sum(single, (o) => o.prod)),
    round2(sum(single, (o) => o.base)),
  ];
}

const cells = new Map();
for (const r of orders) {
  const shop = shopIndex.get(r.id_otica);
  const model = Number(r.id_lente.slice(1));
  const dt = date(r.data_encomenda);
  if (shop === undefined || !Number.isFinite(model) || !dt) continue;
  const prod = production.get(r.id_encomenda) ?? 0;
  const log = logistics.get(r.id_encomenda) ?? 0;
  const occ = incident.get(r.id_encomenda) ?? 0;
  const value = num(r.valor_total);
  const qty = num(r.quantidade);
  const p = price.get(r.id_lente);
  const delivered = r.estado === "entregue";
  const prev = date(r.data_entrega_prevista);
  const real = date(r.data_entrega_real);
  const days =
    prev && real
      ? Math.round((real.getTime() - prev.getTime()) / 86400000)
      : null;
  const contributionOrder = value - prod - log - occ;
  const contributionLens = value - prod * qty - log - occ;
  const key = `${shop}:${dt.getUTCFullYear()}:${dt.getUTCMonth() + 1}:${model}`;
  const row = cells.get(key) ?? [];
  row.push({
    qty,
    value,
    prod,
    log,
    occ,
    base: baseCost.get(r.id_lente) ?? 0,
    delivered,
    affected: affected.has(r.id_encomenda),
    delay: days,
    contributionOrder,
    contributionLens,
    low: delivered && p ? value / qty / p < 0.8 : false,
  });
  cells.set(key, row);
}

const rows = [...cells.entries()]
  .map(([key, g]) => {
    const [shop, year, month, model] = key.split(":").map(Number);
    return [shop, year, month, model, ...cell(g)];
  })
  .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3]);

const cube = JSON.parse(readFileSync(CUBE, "utf8"));
const tolerance = 0.05;
for (let i = 0; i < MEASURES.length; i++) {
  const a = rows.reduce((n, r) => n + r[4 + i], 0);
  const b = cube.rows.reduce((n, r) => n + r[4 + i], 0);
  if (Math.abs(a - b) > tolerance) {
    throw new Error(
      `Totals differ for ${MEASURES[i]}: model cube ${a}, cube ${b}`,
    );
  }
}

writeFileSync(OUT, `${JSON.stringify({ measures: MEASURES, rows })}\n`, "utf8");
console.log(
  `model cube: ${rows.length} rows, ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`,
);
