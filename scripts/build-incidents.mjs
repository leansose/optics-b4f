/**
 * Builds src/data/incidents.json from public/data/lentes/csv/retrabalho_devolucoes.csv.
 *
 * Only incident records linked to a delivered order are kept, so the cause
 * counts and costs stay consistent with the incident cost in cube.json.
 * Motives are normalised into stable English keys for the decision panel.
 * Original data files are not modified.
 *
 * Run from the project root: npm run build-incidents
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "public/data/lentes/csv/retrabalho_devolucoes.csv");
const OUT = resolve(ROOT, "src/data/incidents.json");
const ORDERS = resolve(ROOT, "src/data/orders.json");

const TYPES = ["ajuste", "retrabalho", "devolucao", "substituicao"];
const MOTIVES = [
  "unspecified",
  "wrong_graduation",
  "scratched_lens",
  "mounting",
  "discomfort",
  "damage",
  "uneven_tint",
];
const MOTIVE_MAP = new Map([
  ["", 0],
  ["erro_de_graduacao", 1],
  ["graduacao_errada", 1],
  ["lente_riscada", 2],
  ["montagem", 3],
  ["desconforto", 4],
  ["avaria", 5],
  ["tinte_desigual", 6],
]);

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

function slug(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

const lines = readFileSync(CSV, "utf8")
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/);
const header = parseCsvLine(lines[0]);
const records = lines
  .slice(1)
  .map((line) =>
    Object.fromEntries(
      header.map((key, i) => [key, parseCsvLine(line)[i] ?? ""]),
    ),
  );

const validOrders = new Map(
  JSON.parse(readFileSync(ORDERS, "utf8")).rows.map((r) => [r[0], r]),
);

const buckets = new Map();
let used = 0;
for (const r of records) {
  const order = validOrders.get(r.id_encomenda);
  if (!order) continue;
  const type = TYPES.indexOf(slug(r.tipo_ocorrencia));
  const motive = MOTIVE_MAP.get(slug(r.motivo)) ?? 0;
  if (type < 0) throw new Error(`Unknown incident type: ${r.tipo_ocorrencia}`);
  const year = Number.parseInt(String(r.data_registo).slice(0, 4), 10);
  const key = `${order[1]}:${year}:${order[3]}:${type}:${motive}`;
  const bucket = buckets.get(key) ?? [
    order[1],
    year,
    order[3],
    type,
    motive,
    0,
    0,
  ];
  bucket[5] += 1;
  bucket[6] += Number(String(r.custo_estimado).replace(",", ".")) || 0;
  buckets.set(key, bucket);
  used += 1;
}

if (!used) throw new Error("No incident records linked to delivered orders");
const rows = [...buckets.values()].sort(
  (a, b) =>
    a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3] || a[4] - b[4],
);
for (const row of rows) row[6] = Math.round(row[6] * 100) / 100;

writeFileSync(
  OUT,
  `${JSON.stringify({ types: TYPES, motives: MOTIVES, rows })}\n`,
  "utf8",
);
console.log(
  `incidents: ${used} linked records in ${rows.length} rows, ${(readFileSync(OUT).length / 1024).toFixed(1)} KB`,
);
