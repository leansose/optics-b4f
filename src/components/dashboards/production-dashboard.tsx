"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, PageShell } from "@/components/page-shell";
import { Stat } from "@/components/stat";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import {
  aggregate,
  GROUP_LABELS,
  groupOfModel,
  groupRates,
  shopRates,
} from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import { fmtInt, fmtPct, fmtUnits } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export function ProductionDashboard() {
  const { filters, setFilters, reset } = useFilters();
  const { t } = useI18n();

  const sel = useMemo(() => aggregate(filters), [filters]);
  const net = useMemo(() => aggregate({ ...filters, shop: null }), [filters]);
  const groups = useMemo(() => groupRates(filters), [filters]);
  const shops = useMemo(() => shopRates(filters), [filters]);

  const rate = sel.o ? sel.a / sel.o : 0;
  const netRate = net.o ? net.a / net.o : 0;
  const tone =
    rate > netRate * 1.15 ? "signal" : rate < netRate * 0.85 ? "clear" : "ink";
  const dev = sel.sb ? sel.sp / sel.sb - 1 : null;

  const rest = groups[1].orders + groups[2].orders;
  const restRate = rest ? (groups[1].affected + groups[2].affected) / rest : 0;
  const ratio = restRate ? groups[0].rate / restRate : 0;
  const selectedGroup =
    filters.model === null ? null : groupOfModel(filters.model);

  const groupData = groups.map((g) => ({
    name: g.group === 2 ? t("production.groupOther") : GROUP_LABELS[g.group],
    group: g.group,
    rate: Number((g.rate * 100).toFixed(2)),
  }));

  const shopData = [...shops]
    .sort((a, b) => b.observed - a.observed)
    .map((s) => ({
      name: s.name,
      shop: s.shop,
      observed: Number((s.observed * 100).toFixed(2)),
      adjusted: Number((s.adjusted * 100).toFixed(2)),
    }));

  return (
    <PageShell step={1} title={t("production.title")}>
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <Stat
          tone={tone}
          value={fmtPct(rate)}
          label={t("production.statOrders")}
          note={t("production.ordersNote", {
            affected: fmtInt(sel.a),
            orders: fmtInt(sel.o),
            network: t("common.network"),
            rate: fmtPct(netRate),
          })}
        />
        <Stat
          value={fmtUnits(sel.ic)}
          label={t("production.statIncidentCost")}
          note={
            net.ic
              ? t("production.networkShare", {
                  share: fmtPct(sel.ic / net.ic),
                  network: t("common.network"),
                })
              : undefined
          }
        />
        <Stat
          value={dev === null ? "–" : `${dev >= 0 ? "+" : ""}${fmtPct(dev)}`}
          label={t("production.statVsCatalogue")}
          note={t("production.singleLens")}
        />
      </div>

      <div className="grid flex-1 gap-4 md:grid-cols-[0.85fr_1.35fr]">
        <Card title={t("production.cardGroups")}>
          <div
            role="img"
            aria-label={t("production.groupsAria")}
            className="h-64"
            data-keyboard-control
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                barCategoryGap="28%"
              >
                <CartesianGrid
                  vertical={false}
                  stroke={CHART.line}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={CHART_TICK}
                  tickMargin={6}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  domain={[0, "dataMax + 2"]}
                  width={36}
                  tickFormatter={(v) => `${v}%`}
                  tick={CHART_TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: CHART.brandSoft }}
                  contentStyle={CHART_TOOLTIP}
                  formatter={(value) => [
                    `${Number(value).toFixed(1)}%`,
                    t("production.problemRate"),
                  ]}
                />
                <ReferenceLine
                  y={Number((netRate * 100).toFixed(2))}
                  stroke={CHART.coating}
                  strokeDasharray="5 3"
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {groupData.map((d) => (
                    <Cell
                      key={d.group}
                      fill={d.group === 0 ? CHART.signal : CHART.neutral}
                      opacity={
                        selectedGroup === null || selectedGroup === d.group
                          ? 1
                          : 0.4
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {ratio > 0 ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-display text-xl font-semibold tabular-nums text-signal-ink">
                {ratio.toFixed(1)}×
              </span>{" "}
              {t("production.ratioSuffix")}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{t("production.groupNote")}</p>
        </Card>

        <Card title={t("production.cardShops")}>
          {sel.o ? (
            <>
              <div
                role="img"
                aria-label={t("production.shopsAria")}
                className="h-64"
                data-keyboard-control
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shopData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    barGap={2}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke={CHART.line}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      minTickGap={14}
                      tick={CHART_TICK}
                      tickMargin={6}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="number"
                      domain={[0, "dataMax + 2"]}
                      width={36}
                      tickFormatter={(v) => `${v}%`}
                      tick={CHART_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: CHART.brandSoft }}
                      contentStyle={CHART_TOOLTIP}
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)}%`,
                        name === "observed"
                          ? t("production.observed")
                          : t("production.adjusted"),
                      ]}
                    />
                    <ReferenceLine
                      y={Number((netRate * 100).toFixed(2))}
                      stroke={CHART.coating}
                      strokeDasharray="5 3"
                    />
                    <Bar
                      dataKey="observed"
                      name="observed"
                      radius={[6, 6, 0, 0]}
                      style={{ cursor: "pointer" }}
                      onClick={(item) =>
                        setFilters({
                          shop:
                            filters.shop === item.payload.shop
                              ? null
                              : item.payload.shop,
                        })
                      }
                    >
                      {shopData.map((s) => (
                        <Cell
                          key={s.shop}
                          fill={
                            filters.shop === s.shop ? CHART.brand : CHART.signal
                          }
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="adjusted"
                      name="adjusted"
                      radius={[6, 6, 0, 0]}
                      style={{ cursor: "pointer" }}
                      onClick={(item) =>
                        setFilters({
                          shop:
                            filters.shop === item.payload.shop
                              ? null
                              : item.payload.shop,
                        })
                      }
                    >
                      {shopData.map((s) => (
                        <Cell
                          key={s.shop}
                          fill={CHART.clear}
                          opacity={filters.shop === s.shop ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: CHART.signal }}
                  />
                  {t("production.observed")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: CHART.clear }}
                  />
                  {t("production.adjustedLegend")}
                </span>
                <span>
                  {t("production.shopNote", { network: fmtPct(netRate) })}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-muted">
              <p>{t("production.noOrders")}</p>
              <button
                type="button"
                onClick={reset}
                className="text-brand-ink underline underline-offset-2"
              >
                {t("common.resetFilters")}
              </button>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
