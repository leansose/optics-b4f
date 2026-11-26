/**
 * Builds src/data/orders.json from public/data/lentes/csv.
 *
 * Same deduplication and cost formulas as scripts/build-metrics.py, but keeps
 * one row per delivered order so Finance can inspect any order instead of a
 * single hard-coded example. Original data files are not modified.
 *
 * Run from the project root: npm run build-orders
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "public/data/lentes/csv");
const OUT = resolve(ROOT, "src/data/orders.json");
const CUBE = resolve(ROOT, "src/data/cube.json");

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

const shopIds = JSON.parse(readFileSync(CUBE, "utf8")).shops.map((s) => s.id);
const shopIndex = new Map(shopIds.map((id, i) => [id, i]));

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
for (const r of readCsv("retrabalho_devolucoes.csv")) {
  if (!valid.has(r.id_encomenda)) continue;
  incident.set(
    r.id_encomenda,
    (incident.get(r.id_encomenda) ?? 0) + num(r.custo_estimado),
  );
}

// code, shop index, year, model id, qty, value, production, logistics, incident
const rows = [];
for (const r of orders) {
  if (r.estado !== "entregue") continue;
  const shop = shopIndex.get(r.id_otica);
  const model = Number(r.id_lente.slice(1));
  const dt = date(r.data_encomenda);
  if (shop === undefined || !Number.isFinite(model) || !dt) continue;
  rows.push([
    r.id_encomenda,
    shop,
    dt.getUTCFullYear(),
    model,
    num(r.quantidade),
    round2(num(r.valor_total)),
    round2(production.get(r.id_encomenda) ?? 0),
    round2(logistics.get(r.id_encomenda) ?? 0),
    round2(incident.get(r.id_encomenda) ?? 0),
  ]);
}

const cube = JSON.parse(readFileSync(CUBE, "utf8"));
const idx = Object.fromEntries(cube.measures.map((m, i) => [m, i + 4]));
const cubeTotal = (measure) =>
  cube.rows.reduce((n, r) => n + r[idx[measure]], 0);
const orderTotal = (col) => rows.reduce((n, r) => n + r[col], 0);
const checks = [
  ["d", rows.length, cubeTotal("d")],
  ["v", orderTotal(5), cubeTotal("v")],
  ["p", orderTotal(6), cubeTotal("p")],
  ["lg", orderTotal(7), cubeTotal("lg")],
  ["oc", orderTotal(8), cubeTotal("oc")],
];
for (const [name, actual, expected] of checks) {
  if (Math.abs(actual - expected) > 0.05) {
    throw new Error(
      `Orders ${name} total ${actual} does not match cube total ${expected}`,
    );
  }
}

writeFileSync(
  OUT,
  `${JSON.stringify({
    fields: [
      "code",
      "shop",
      "year",
      "model",
      "qty",
      "value",
      "production",
      "logistics",
      "incident",
    ],
    rows,
  })}\n`,
  "utf8",
);
console.log(
  `orders: ${rows.length} delivered rows, ${(readFileSync(OUT).length / 1024).toFixed(0)} KB`,
);
