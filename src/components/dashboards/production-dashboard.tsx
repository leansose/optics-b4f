"use client";

import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  Factory,
  PackageCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, PageShell } from "@/components/page-shell";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import {
  aggregate,
  GROUP_LABELS,
  groupRates,
  monthlyOrders,
  shopRates,
} from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import { useFormat } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function ProductionDashboard() {
  const { fmtInt, fmtPct, fmtUnits } = useFormat();
  const { t, locale } = useI18n();
  const { filters } = useFilters();
  const pt = locale === "pt";
  const a = useMemo(() => aggregate(filters), [filters]);
  const groups = useMemo(() => groupRates(filters), [filters]);
  const shops = useMemo(
    () =>
      shopRates(filters)
        .filter((s) => s.orders > 0)
        .sort((x, y) => y.observed - x.observed),
    [filters],
  );
  const months = useMemo(() => {
    const first = monthlyOrders(filters, 2024);
    const next = monthlyOrders(filters, 2025);
    const month = new Intl.DateTimeFormat(pt ? "pt-PT" : "en-GB", {
      month: "short",
      timeZone: "UTC",
    });
    return first.map((n, i) => ({
      month: month.format(new Date(Date.UTC(2024, i, 1))).replace(".", ""),
      "2024": n,
      "2025": next[i],
    }));
  }, [filters, pt]);
  const years = filters.year === null ? [2024, 2025] : [filters.year];
  const rate = a.o ? fmtPct(a.a / a.o) : "—";
  const impact = [
    { label: pt ? "Entregues" : "Delivered", value: a.d, fill: "#f19d92" },
    {
      label: pt ? "Restantes" : "Other orders",
      value: a.o - a.d,
      fill: "#788174",
    },
  ];
  const network = useMemo(
    () => aggregate({ ...filters, shop: null }),
    [filters],
  );
  const networkRate = network.o ? (100 * network.a) / network.o : 0;
  const groupData = groups.map((g) => ({
    name: g.group === 2 ? t("production.groupOther") : GROUP_LABELS[g.group],
    rate: 100 * g.rate,
    orders: g.orders,
    affected: g.affected,
    fill: g.group === 0 ? CHART.brand : CHART.clear,
  }));
  const detailsLink =
    "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-green underline-offset-4 hover:underline";
  return (
    <PageShell title={t("production.title")} intro={t("intro.production")}>
      <div className="grid gap-5 lg:grid-cols-[minmax(17rem,0.85fr)_minmax(0,2fr)]">
        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-[#343b32] bg-onyx p-6 text-[#f4f3ee] sm:p-7">
          <h2 className="flex items-center gap-2.5 text-base font-semibold tracking-normal">
            <Boxes className="size-5 text-[#f19d92]" aria-hidden="true" />
            {pt ? "Encomendas na seleção" : "Orders in selection"}
          </h2>
          <div>
            <strong className="block text-5xl leading-none tracking-[-0.045em] xl:text-6xl">
              {fmtInt(a.o)}
            </strong>
            <p className="mt-3 text-sm leading-relaxed text-dust">
              {pt
                ? "Encomendas distintas no período."
                : "Distinct orders in the period."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-[#454b42] pt-5">
            <div className="relative size-[4.5rem] shrink-0" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={impact}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="70%"
                    outerRadius="95%"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive={false}
                  />
                </PieChart>
              </ResponsiveContainer>
              <PackageCheck className="absolute top-1/2 left-1/2 size-5 -translate-1/2 text-dust" />
            </div>
            <div>
              <span className="block text-2xl font-semibold">
                {a.o ? fmtPct(a.d / a.o) : "—"}
              </span>
              <span className="text-sm text-dust">
                {fmtInt(a.d)} {pt ? "entregues" : "delivered"}
              </span>
            </div>
          </div>
        </section>
        <Card className="flex flex-col">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {pt ? "Ritmo das encomendas" : "Order volume by month"}
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {pt
                  ? "Encomendas distintas por mês"
                  : "Distinct orders per month"}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted">
              {years.map((y) => (
                <span key={y} className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={
                      y === 2025
                        ? "w-5 border-t-[3px] border-chart"
                        : "w-5 border-t-2 border-dashed border-adjusted"
                    }
                  />
                  {y}
                </span>
              ))}
            </div>
          </div>
          <figure
            className="h-48 min-w-0 grow"
            aria-label={
              pt ? "Evolução mensal das encomendas" : "Monthly orders trend"
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={months}
                margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="order-volume-fill"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={CHART.brand}
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="100%"
                      stopColor={CHART.brand}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke={CHART.line}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="month"
                  tick={CHART_TICK}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={10}
                  tickMargin={8}
                />
                <YAxis
                  width="auto"
                  tick={CHART_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtInt}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP}
                  formatter={(n) => fmtInt(Number(n))}
                />
                {years.includes(2025) && (
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="2025"
                    stroke={CHART.brand}
                    strokeWidth={3}
                    dot={{ r: 2, fill: CHART.brand }}
                    fill="url(#order-volume-fill)"
                  />
                )}
                {years.includes(2024) && (
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="2024"
                    dot={false}
                    stroke={CHART.clear}
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </figure>
          <details className="mt-3 text-sm">
            <summary className="w-fit py-1 font-medium text-green">
              {pt ? "Consultar valores mensais" : "View monthly values"}
            </summary>
            <table className="mt-3 w-full text-left">
              <caption className="sr-only">
                {pt ? "Encomendas por mês e ano" : "Orders by month and year"}
              </caption>
              <thead>
                <tr>
                  <th>{pt ? "Mês" : "Month"}</th>
                  {years.map((y) => (
                    <th key={y}>{y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr className="border-t border-line" key={m.month}>
                    <th className="py-1 font-medium">{m.month}</th>
                    {years.map((y) => (
                      <td key={y}>{fmtInt(m[y as 2024 | 2025])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>
      </div>
      <section
        aria-label={pt ? "Indicadores de produção" : "Production indicators"}
        className="grid gap-5 border-y border-line py-6 sm:grid-cols-3 sm:gap-8"
      >
        {[
          {
            Icon: CircleAlert,
            label: t("production.statOrders"),
            value: rate,
            note: pt
              ? `${fmtInt(a.a)} encomendas com ocorrência.`
              : `${fmtInt(a.a)} orders with an incident.`,
          },
          {
            Icon: Factory,
            label: t("production.statIncidentCost"),
            value: fmtUnits(a.ic),
            note: pt
              ? "Custo estimado das ocorrências associadas."
              : "Estimated cost of linked incidents.",
          },
          {
            Icon: TrendingUp,
            label: t("production.statVsCatalogue"),
            value: a.sb ? fmtPct(a.sp / a.sb - 1) : "—",
            note: t("production.singleLens"),
          },
        ].map(({ Icon, label, value, note }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-soft text-green">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-normal text-muted">
                {label}
              </h2>
              <strong className="my-1.5 block text-3xl tracking-tight">
                {value}
              </strong>
              <p className="text-sm leading-relaxed text-muted">{note}</p>
            </div>
          </div>
        ))}
      </section>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.25fr]">
        <Card title={t("production.cardGroups")}>
          <p className="mb-4 text-sm leading-relaxed text-muted">
            {pt
              ? "Encomendas com ocorrência por família de modelos, na ótica e no ano escolhidos."
              : "Orders with incidents by model family for the selected optician and year."}
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupData}
                margin={{ left: 0, right: 6, top: 8, bottom: 0 }}
                barSize={42}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={CHART.line}
                  strokeDasharray="3 5"
                />
                <XAxis
                  dataKey="name"
                  tick={CHART_TICK}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width="auto"
                  tick={CHART_TICK}
                  tickFormatter={(n) => `${n}%`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP}
                  cursor={{ fill: CHART.brandSoft }}
                  formatter={(n) => [
                    fmtPct(Number(n) / 100),
                    t("production.problemRate"),
                  ]}
                />
                <Bar
                  dataKey="rate"
                  radius={[5, 5, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-line pt-4 text-sm">
            {groupData.map((g) => (
              <span key={g.name}>
                {g.name}
                <strong className="mt-1 block">
                  {g.orders ? fmtPct(g.rate / 100) : "—"}
                </strong>
              </span>
            ))}
          </div>
        </Card>
        <Card title={t("production.cardShops")}>
          <p className="mb-3 max-w-prose text-sm leading-relaxed text-muted">
            {pt
              ? "Compare as taxas de ocorrência antes e depois de aplicar a mesma distribuição de modelos a todas as óticas."
              : "Compare incident rates before and after applying the same lens mix to all opticians."}
          </p>
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-chart" />
              {t("production.observed")}
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 border-2 border-adjusted" />
              {t("production.adjusted")}
            </span>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface text-left text-muted">
                <tr>
                  <th className="pb-2">{t("common.shop")}</th>
                  <th className="pb-2 text-right">
                    {t("production.observed")}
                  </th>
                  <th className="pb-2 text-right">
                    {t("production.adjusted")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr
                    key={s.shop}
                    className={`border-t border-line ${filters.shop === s.shop ? "bg-brand-soft" : ""}`}
                  >
                    <th className="py-2.5 text-left font-medium">{s.name}</th>
                    <td className="text-right font-semibold text-green">
                      {fmtPct(s.observed)}
                    </td>
                    <td className="text-right">{fmtPct(s.adjusted)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span>
              {pt ? "Taxa da rede" : "Network rate"} ·{" "}
              {fmtPct(networkRate / 100)}
            </span>
            <Link className={detailsLink} href="/comparacao">
              {pt ? "Explorar óticas" : "Explore opticians"}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
