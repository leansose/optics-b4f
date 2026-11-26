"use client";

import { ScanEye } from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { ProductRow } from "@/lib/products";
import { Card } from "./page-shell";

export function CatalogueChart({ rows }: { rows: ProductRow[] }) {
  const { fmtInt, fmtPct, fmtUnits } = useFormat();
  const { locale } = useI18n();
  const pt = locale === "pt";
  const points = rows.filter((r) => r.orders > 0);
  const top = [...points].sort((a, b) => b.orders - a.orders)[0];
  const high = [...points].sort((a, b) => b.incidentRate - a.incidentRate)[0];
  return (
    <Card className="grid gap-5 lg:grid-cols-[minmax(13rem,1fr)_minmax(0,2fr)]">
      <div>
        <ScanEye className="mb-3 size-6 text-green" aria-hidden="true" />
        <h2 className="text-xl">
          {pt ? "Procura e ocorrências" : "Demand and incidents"}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          {pt
            ? "Cada ponto é um modelo. Mais à direita, maior a procura. Mais acima, maior a percentagem de encomendas com ocorrência."
            : "Each dot is a lens model. Further right means more orders. Higher up means a larger share of orders with an incident."}
        </p>
        {top && high && (
          <p className="mt-4 text-sm">
            <strong>{top.id}</strong>{" "}
            {pt ? "lidera em encomendas" : "leads by order volume"} (
            {fmtInt(top.orders)}). <strong>{high.id}</strong>{" "}
            {pt ? "tem a taxa mais alta" : "has the highest rate"} (
            {fmtPct(high.incidentRate)}).
          </p>
        )}
      </div>
      {points.length ? (
        <figure
          className="h-52 min-w-0"
          aria-label={
            pt
              ? "Relação entre encomendas e ocorrências"
              : "Orders against incident rate"
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 2, top: 12, right: 16, bottom: 12 }}>
              <CartesianGrid stroke={CHART.line} strokeDasharray="3 5" />
              <XAxis
                type="number"
                dataKey="orders"
                name={pt ? "Encomendas" : "Orders"}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtInt}
              />
              <YAxis
                type="number"
                dataKey="incidentRate"
                name={pt ? "Taxa" : "Rate"}
                width="auto"
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={(n) => fmtPct(n, 0)}
              />
              <ZAxis range={[65, 65]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  const r = payload?.[0]?.payload as ProductRow | undefined;
                  return active && r ? (
                    <div style={CHART_TOOLTIP} className="p-3">
                      <strong>
                        {r.id} · {r.model}
                      </strong>
                      <p>
                        {fmtInt(r.orders)} {pt ? "encomendas" : "orders"}
                      </p>
                      <p>
                        {fmtUnits(r.incidentRate * 100, 1)}%{" "}
                        {pt ? "com ocorrência" : "with an incident"}
                      </p>
                    </div>
                  ) : null;
                }}
              />
              <Scatter
                data={points}
                fill={CHART.brand}
                fillOpacity={0.7}
                stroke={CHART.brandInk}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </figure>
      ) : (
        <p className="self-center text-muted">
          {pt
            ? "Sem encomendas para os filtros escolhidos."
            : "No orders match the selected filters."}
        </p>
      )}
    </Card>
  );
}
