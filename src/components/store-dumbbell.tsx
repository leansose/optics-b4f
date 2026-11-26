import { metrics } from "@/data/metrics";
import { fmtPct } from "@/lib/format";

const W = 640;
const ROW = 24;
const LEFT = 92;
const RIGHT = 20;
const TOP = 8;
const AXIS = 26;
const MAX = 0.1;
const TICKS = [0, 0.02, 0.04, 0.06, 0.08, 0.1];

export function StoreDumbbell() {
  const rows = [...metrics.quality.opticians].sort(
    (a, b) => b.observed - a.observed,
  );
  const H = TOP + rows.length * ROW + AXIS;
  const x = (v: number) => LEFT + (v / MAX) * (W - LEFT - RIGHT);
  const network = metrics.network.affectedRate;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby="dumbbell-title"
      className="h-auto w-full"
    >
      <title id="dumbbell-title">
        Share of orders with an incident per shop, observed and adjusted to the
        network model mix
      </title>
      {TICKS.map((t) => (
        <g key={t}>
          <line
            x1={x(t)}
            x2={x(t)}
            y1={TOP}
            y2={H - AXIS}
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text
            x={x(t)}
            y={H - 8}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted)"
          >
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <line
        x1={x(network)}
        x2={x(network)}
        y1={TOP}
        y2={H - AXIS}
        stroke="var(--ink)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      {rows.map((r, i) => {
        const y = TOP + i * ROW + ROW / 2;
        const isCoimbra = r.name === "Coimbra";
        return (
          <g key={r.id}>
            <text
              x={LEFT - 10}
              y={y + 4}
              textAnchor="end"
              fontSize={12}
              fontWeight={isCoimbra ? 700 : 400}
              fill="var(--ink)"
            >
              {r.name}
            </text>
            <line
              x1={x(r.adjusted)}
              x2={x(r.observed)}
              y1={y}
              y2={y}
              stroke={isCoimbra ? "var(--signal)" : "var(--muted)"}
              strokeWidth={isCoimbra ? 2.5 : 1.5}
              opacity={isCoimbra ? 1 : 0.55}
            />
            <rect
              x={x(r.adjusted) - 4.5}
              y={y - 4.5}
              width={9}
              height={9}
              fill="var(--clear)"
            />
            <circle cx={x(r.observed)} cy={y} r={5} fill="var(--signal)" />
            {isCoimbra ? (
              <>
                <text
                  x={x(r.observed) + 10}
                  y={y + 4}
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--signal)"
                >
                  {fmtPct(r.observed, 2)} observed
                </text>
                <text
                  x={x(r.adjusted) - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--clear)"
                >
                  {fmtPct(r.adjusted, 2)} adjusted
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
