"use client";
import { FileSearch } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { metrics } from "@/data/metrics";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Card } from "./page-shell";

export function QualityChart() {
  const { fmtInt } = useFormat();
  const pt = useI18n().locale === "pt";
  const q = metrics.dataQuality;
  const rows = [
    {
      name: pt ? "Sem resolução" : "No resolution",
      count: q.missingResolution,
      fill: CHART.brand,
    },
    {
      name: pt ? "Sem motivo" : "No reason",
      count: q.missingMotive,
      fill: CHART.clear,
    },
    {
      name: pt ? "Sem encomenda" : "No order",
      count: q.unlinkedIncidents,
      fill: CHART.muted,
    },
  ];
  return (
    <Card className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]">
      <div>
        <FileSearch className="mb-4 size-6 text-green" aria-hidden="true" />
        <h2 className="text-2xl">
          {pt
            ? "Lacunas no registo de ocorrências"
            : "Gaps in the incident register"}
        </h2>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">
          {pt
            ? `Foram analisadas ${fmtInt(q.totalIncidents)} ocorrências. Uma ocorrência pode ter vários campos em falta.`
            : `The register contains ${fmtInt(q.totalIncidents)} incidents. An incident can have more than one missing field.`}
        </p>
        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          {rows.map((r) => (
            <div key={r.name}>
              <dt className="text-sm text-muted">{r.name}</dt>
              <dd className="mt-1 text-xl font-semibold">{fmtInt(r.count)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={rows}
            margin={{ left: 0, top: 8, right: 8, bottom: 0 }}
            barSize={20}
          >
            <CartesianGrid
              horizontal={false}
              stroke={CHART.line}
              strokeDasharray="3 5"
            />
            <XAxis
              type="number"
              tick={CHART_TICK}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width="auto"
              tick={CHART_TICK}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP}
              cursor={{ fill: CHART.brandSoft }}
              formatter={(n) => [
                fmtInt(Number(n)),
                pt ? "Ocorrências" : "Incidents",
              ]}
            />
            <Bar
              dataKey="count"
              isAnimationActive={false}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
