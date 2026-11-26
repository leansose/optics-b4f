import raw from "@/data/feedback.json";

/** shop index, year, sum of scores, number of ratings */
type FeedbackRow = readonly [number, number, number, number];

type FeedbackJson = {
  fields: string[];
  rows: FeedbackRow[];
};

const ROWS = (raw as unknown as FeedbackJson).rows;

/** Shop-level satisfaction; feedback is not reliably linked to orders or models. */
export function feedbackStats(shop: number | null, year: number | null) {
  let scoreSum = 0;
  let count = 0;
  for (const r of ROWS) {
    if (shop !== null && r[0] !== shop) continue;
    if (year !== null && r[1] !== year) continue;
    scoreSum += r[2];
    count += r[3];
  }
  return { score: count ? scoreSum / count : 0, count };
}
