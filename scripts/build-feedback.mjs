/**
 * Builds src/data/feedback.json from public/data/lentes/csv/feedback_oticas.csv.
 *
 * Only shop-level, per-year satisfaction counts are kept: the source ratings are
 * not reliably linked to orders or models, so the decision panel shows them at
 * optician level. Original data files are not modified.
 *
 * Run from the project root: npm run build-feedback
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = resolve(ROOT, "public/data/lentes/csv/feedback_oticas.csv");
const OUT = resolve(ROOT, "src/data/feedback.json");
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

const text = readFileSync(CSV, "utf8").replace(/^\uFEFF/, "");
const lines = text.trim().split(/\r?\n/);
const header = parseCsvLine(lines[0]);
const records = lines
  .slice(1)
  .map((line) =>
    Object.fromEntries(
      header.map((key, i) => [key, parseCsvLine(line)[i] ?? ""]),
    ),
  );

const shopIds = JSON.parse(readFileSync(CUBE, "utf8")).shops.map((s) => s.id);
const shopIndex = new Map(shopIds.map((id, i) => [id, i]));

const buckets = new Map();
let used = 0;
for (const r of records) {
  const shop = shopIndex.get(r.id_otica);
  const year = Number.parseInt(String(r.data ?? "").slice(0, 4), 10);
  const score = Number(String(r.satisfacao_geral ?? "").replace(",", "."));
  if (shop === undefined || !Number.isFinite(year) || !Number.isFinite(score)) {
    continue;
  }
  const key = `${shop}:${year}`;
  const bucket = buckets.get(key) ?? { shop, year, sum: 0, count: 0 };
  bucket.sum += score;
  bucket.count += 1;
  buckets.set(key, bucket);
  used += 1;
}

const rows = [...buckets.values()]
  .sort((a, b) => a.shop - b.shop || a.year - b.year)
  .map((b) => [b.shop, b.year, Math.round(b.sum * 100) / 100, b.count]);

if (used !== records.length) {
  throw new Error(`Skipped ${records.length - used} feedback rows`);
}
if (rows.reduce((n, r) => n + r[3], 0) !== records.length) {
  throw new Error("Feedback counts do not match the source rows");
}

writeFileSync(
  OUT,
  `${JSON.stringify({ fields: ["shop", "year", "scoreSum", "count"], rows })}\n`,
  "utf8",
);
console.log(
  `feedback: ${records.length} ratings in ${rows.length} shop-year rows, ${(readFileSync(OUT).length / 1024).toFixed(1)} KB`,
);
