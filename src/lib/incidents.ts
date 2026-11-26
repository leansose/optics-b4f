import raw from "@/data/incidents.json";

type IncidentJson = {
  types: string[];
  motives: string[];
  /** shop, year, model, type index, motive index, count, cost */
  rows: readonly (readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ])[];
};

const DATA = raw as unknown as IncidentJson;

export type IncidentCause = {
  type: string;
  motive: string;
  count: number;
  cost: number;
  /** Share of incident cost in the same scope. */
  share: number;
};

/** Ranked incident causes for one shop / year / model selection. */
export function incidentCauses(
  shop: number | null,
  year: number | null,
  models: readonly number[] | null,
  limit = 3,
): IncidentCause[] {
  const wanted = models ? new Set(models) : null;
  const sums = new Map<string, { count: number; cost: number }>();
  let total = 0;

  for (const r of DATA.rows) {
    if (shop !== null && r[0] !== shop) continue;
    if (year !== null && r[1] !== year) continue;
    if (wanted && !wanted.has(r[2])) continue;
    const key = `${r[3]}:${r[4]}`;
    const entry = sums.get(key) ?? { count: 0, cost: 0 };
    entry.count += r[5];
    entry.cost += r[6];
    sums.set(key, entry);
    total += r[6];
  }

  return [...sums.entries()]
    .map(([key, entry]) => {
      const [typeIndex, motiveIndex] = key.split(":").map(Number);
      return {
        type: DATA.types[typeIndex] ?? "",
        motive: DATA.motives[motiveIndex] ?? "unspecified",
        count: entry.count,
        cost: entry.cost,
        share: total ? entry.cost / total : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost)
    .slice(0, limit);
}
