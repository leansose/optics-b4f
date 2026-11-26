import { metrics } from "@/data/metrics";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const W = 640;
const H = 280;
const LEFT = 44;
const RIGHT = 8;
const TOP = 34;
const BOTTOM = 26;
const MAX = 3500;
const GRID = [0, 1000, 2000, 3000];

export function MonthlyOrdersChart() {
  const { monthly, perDayNovDec, perDayJulAug } = metrics.logistics;
  const plotW = W - LEFT - RIGHT;
  const plotH = H - TOP - BOTTOM;
  const slot = plotW / 12;
  const barW = slot * 0.36;
  const y = (v: number) => TOP + plotH - (v / MAX) * plotH;
  const avg = (a: number, b: number) => Math.round((a + b) / 2);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="monthly-title"
      className="h-auto w-full"
    >
      <title id="monthly-title">
        Distinct orders per month in 2024 and 2025, with higher volume in
        November and December
      </title>
      <rect
        x={LEFT + slot * 6}
        y={TOP - 22}
        width={slot * 2}
        height={plotH + 22}
        fill="var(--clear)"
        opacity={0.1}
      />
      <rect
        x={LEFT + slot * 10}
        y={TOP - 22}
        width={slot * 2}
        height={plotH + 22}
        fill="var(--signal)"
        opacity={0.1}
      />
      <text
        x={LEFT + slot * 7}
        y={TOP - 8}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="var(--clear)"
      >
        ≈{avg(perDayJulAug.y2024, perDayJulAug.y2025)}/day
      </text>
      <text
        x={LEFT + slot * 11}
        y={TOP - 8}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="var(--signal)"
      >
        ≈{avg(perDayNovDec.y2024, perDayNovDec.y2025)}/day
      </text>
      {GRID.map((g) => (
        <g key={g}>
          <line
            x1={LEFT}
            x2={W - RIGHT}
            y1={y(g)}
            y2={y(g)}
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text
            x={LEFT - 8}
            y={y(g) + 4}
            textAnchor="end"
            fontSize={11}
            fill="var(--muted)"
          >
            {g.toLocaleString("en-US")}
          </text>
        </g>
      ))}
      {MONTHS.map((m, i) => {
        const cx = LEFT + slot * i + slot / 2;
        const a = monthly["2024"][i];
        const b = monthly["2025"][i];
        return (
          <g key={m}>
            <rect
              x={cx - barW - 1}
              y={y(a)}
              width={barW}
              height={TOP + plotH - y(a)}
              fill="var(--muted)"
              opacity={0.45}
            />
            <rect
              x={cx + 1}
              y={y(b)}
              width={barW}
              height={TOP + plotH - y(b)}
              fill="var(--ink)"
            />
            <text
              x={cx}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted)"
            >
              {m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
