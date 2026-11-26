"use client";

import { Info, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DecisionMaker } from "@/components/dashboards/decision-maker";
import { Card, PageShell } from "@/components/page-shell";
import { Stat } from "@/components/stat";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import { type Agg, aggregate } from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import {
  fmtDeltaUnits,
  fmtInt,
  fmtMillions,
  fmtPct,
  fmtUnits,
} from "@/lib/format";
import { type TranslationKey, useI18n } from "@/lib/i18n";

type Mode = "order" | "lens";
type TargetId =
  | "value"
  | "production"
  | "logistics"
  | "incidents"
  | "delivery"
  | "profit";
type Lever = { id: number; target: TargetId; amount: string };
type Target = {
  id: TargetId;
  max: number;
  step: number;
  labelKey: TranslationKey;
  optionKey: TranslationKey;
  hintKey: TranslationKey;
};

const TARGETS: Target[] = [
  {
    id: "value",
    labelKey: "simulator.target.value",
    optionKey: "simulator.option.value",
    hintKey: "simulator.hint.value",
    max: 40,
    step: 1,
  },
  {
    id: "production",
    labelKey: "simulator.target.production",
    optionKey: "simulator.option.production",
    hintKey: "simulator.hint.production",
    max: 60,
    step: 1,
  },
  {
    id: "logistics",
    labelKey: "simulator.target.logistics",
    optionKey: "simulator.option.logistics",
    hintKey: "simulator.hint.logistics",
    max: 80,
    step: 1,
  },
  {
    id: "incidents",
    labelKey: "simulator.target.incidents",
    optionKey: "simulator.option.incidents",
    hintKey: "simulator.hint.incidents",
    max: 100,
    step: 1,
  },
  {
    id: "delivery",
    labelKey: "simulator.target.delivery",
    optionKey: "simulator.option.delivery",
    hintKey: "simulator.hint.delivery",
    max: 25,
    step: 0.5,
  },
  {
    id: "profit",
    labelKey: "simulator.target.profit",
    optionKey: "simulator.option.profit",
    hintKey: "simulator.hint.profit",
    max: 100,
    step: 1,
  },
];

const TARGET_BY_ID = Object.fromEntries(
  TARGETS.map((t) => [t.id, t]),
) as Record<TargetId, Target>;

const MODES: { id: Mode; key: TranslationKey }[] = [
  { id: "order", key: "common.perOrder" },
  { id: "lens", key: "common.perLens" },
];

const TARGET_CAP = 100;

function initialLevers(): Lever[] {
  return [
    { id: 1, target: "incidents", amount: "15" },
    { id: 2, target: "production", amount: "5" },
    { id: 3, target: "profit", amount: "10" },
  ];
}

function readAmount(raw: string, max: number) {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(0, n));
}

function impactOf(
  target: TargetId,
  pct: number,
  a: Agg,
  production: number,
  current: number,
) {
  switch (target) {
    case "value":
      return (a.v * pct) / 100;
    case "production":
      return (production * pct) / 100;
    case "logistics":
      return (a.lg * pct) / 100;
    case "incidents":
      return (a.oc * pct) / 100;
    case "delivery":
      return (current * pct) / 100;
    case "profit":
      // Net profit already has production, incidents and delivery deducted.
      return (current * pct) / 100;
  }
}

type LeverRow = {
  id: number;
  target: Target;
  rawText: string;
  raw: number;
  effective: number;
  impact: number;
};

export function SimulatorDashboard() {
  const { filters, reset: resetFilters } = useFilters();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("order");
  const [levers, setLevers] = useState<Lever[]>(initialLevers);
  const nextId = useRef(4);

  const a = useMemo(() => aggregate(filters), [filters]);
  const perLens = mode === "lens";
  const production = perLens ? a.pl : a.p;
  const current = a.v - production - a.lg - a.oc;

  const modeLabel = (m: Mode) =>
    t(m === "order" ? "common.perOrder" : "common.perLens");
  const rangeWord = (count: number) =>
    t(count === 1 ? "simulator.rangeOne" : "simulator.rangeMany");

  const rows = useMemo<LeverRow[]>(() => {
    const sums = Object.fromEntries(TARGETS.map((t) => [t.id, 0])) as Record<
      TargetId,
      number
    >;
    const parsed = levers.map((lever) => {
      const target = TARGET_BY_ID[lever.target];
      const raw = readAmount(lever.amount, target.max);
      sums[lever.target] += raw;
      return { lever, target, raw };
    });

    return parsed.map(({ lever, target, raw }) => {
      const scale =
        sums[lever.target] > TARGET_CAP ? TARGET_CAP / sums[lever.target] : 1;
      const effective = raw * scale;
      return {
        id: lever.id,
        target,
        rawText: lever.amount,
        raw,
        effective,
        impact: impactOf(lever.target, effective, a, production, current),
      };
    });
  }, [levers, a, production, current]);

  const totalImpact = rows.reduce((sum, r) => sum + r.impact, 0);
  const projected = current + totalImpact;
  const changePct = current ? totalImpact / Math.abs(current) : 0;
  const biggest = [...rows].sort(
    (x, y) => Math.abs(y.impact) - Math.abs(x.impact),
  )[0];

  const update = (id: number, patch: Partial<Lever>) =>
    setLevers((prev) =>
      prev.map((lever) => (lever.id === id ? { ...lever, ...patch } : lever)),
    );

  const addLever = () =>
    setLevers((prev) => [
      ...prev,
      { id: nextId.current++, target: "value", amount: "5" },
    ]);

  const removeLever = (id: number) =>
    setLevers((prev) => prev.filter((lever) => lever.id !== id));

  const reset = () => {
    nextId.current = 4;
    setLevers(initialLevers());
    setMode("order");
  };

  const decision = !a.d
    ? t("simulator.decisionNoOrders")
    : rows.length === 0
      ? t("simulator.decisionNoRanges")
      : t("simulator.decisionRanges", {
          profit: fmtMillions(projected),
          count: rows.length,
          rangeWord: rangeWord(rows.length),
          driver: biggest ? t(biggest.target.labelKey) : "",
        });

  return (
    <PageShell step={4} title={t("simulator.title")} decision={decision}>
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        <Stat
          value={a.d ? fmtMillions(current) : "–"}
          label={t("simulator.statCurrent")}
          note={t("simulator.currentNote", {
            orders: fmtInt(a.d),
            basis: modeLabel(mode).toLowerCase(),
          })}
        />
        <Stat
          tone={totalImpact >= 0 ? "clear" : "signal"}
          value={fmtDeltaUnits(totalImpact, 0)}
          label={t("simulator.statChange")}
          note={t("simulator.activeRanges", {
            count: rows.length,
            rangeWord: rangeWord(rows.length),
          })}
        />
        <Stat
          value={a.d ? fmtMillions(projected) : "–"}
          label={t("simulator.statProjected")}
          note={
            a.d
              ? t("simulator.vsCurrent", { pct: fmtPct(changePct) })
              : undefined
          }
        />
      </div>

      <DecisionMaker basis={mode} />

      <div className="grid flex-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card
          title={t("simulator.cardAdjust")}
          className="flex min-h-0 flex-col p-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-xs text-muted">{t("simulator.intro")}</p>
            <div
              className="flex flex-wrap items-center gap-2"
              data-keyboard-control
            >
              <fieldset className="inline-flex rounded-[var(--control-radius)] bg-panel p-0.5 ring-1 ring-line">
                <legend className="sr-only">{t("common.costBasis")}</legend>
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                    className={`rounded-[8px] px-2.5 py-1 text-[13px] font-medium transition-colors ${
                      mode === m.id
                        ? "bg-surface text-brand-ink shadow-[0_1px_2px_rgba(38,61,84,0.14)]"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {t(m.key)}
                  </button>
                ))}
              </fieldset>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:border-brand hover:text-ink"
              >
                <RotateCcw size={13} aria-hidden="true" />
                {t("common.reset")}
              </button>
            </div>
          </div>

          <div className="flex-1 px-4 py-3">
            {rows.length ? (
              <ul className="space-y-2.5" data-keyboard-control>
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[var(--card-radius)] border border-line bg-panel p-3"
                    data-keyboard-control
                  >
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_92px_28px] md:items-end">
                      <div>
                        <label
                          htmlFor={`target-${row.id}`}
                          className="text-xs font-medium text-muted"
                        >
                          {t("simulator.driver")}
                        </label>
                        <select
                          id={`target-${row.id}`}
                          value={row.target.id}
                          onChange={(e) =>
                            update(row.id, {
                              target: e.target.value as TargetId,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                        >
                          {TARGETS.map((target) => (
                            <option key={target.id} value={target.id}>
                              {t(target.optionKey)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor={`amount-${row.id}`}
                          className="text-xs font-medium text-muted"
                        >
                          {t("simulator.amount")}
                        </label>
                        <div className="relative mt-1">
                          <input
                            id={`amount-${row.id}`}
                            type="number"
                            min={0}
                            max={row.target.max}
                            step={row.target.step}
                            value={row.rawText}
                            onChange={(e) =>
                              update(row.id, { amount: e.target.value })
                            }
                            onBlur={(e) =>
                              update(row.id, {
                                amount: String(
                                  readAmount(e.target.value, row.target.max),
                                ),
                              })
                            }
                            className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 pr-7 text-right text-sm tabular-nums"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted">
                            %
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLever(row.id)}
                        aria-label={t("simulator.removeRange", {
                          label: t(row.target.labelKey),
                        })}
                        className="mb-0.5 inline-flex size-9 items-center justify-center rounded-[var(--control-radius)] border border-line text-muted hover:border-signal hover:text-signal-ink sm:size-7"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={row.target.max}
                        step={row.target.step}
                        value={row.raw}
                        onChange={(e) =>
                          update(row.id, { amount: e.target.value })
                        }
                        aria-label={t("simulator.percentage", {
                          label: t(row.target.labelKey),
                        })}
                        className="range-brand h-1.5 w-full cursor-pointer"
                        style={{ accentColor: "var(--brand)" }}
                      />
                      <span
                        className={`w-20 shrink-0 text-right text-xs font-semibold tabular-nums ${
                          row.impact >= 0 ? "text-clear-ink" : "text-signal-ink"
                        }`}
                      >
                        {fmtDeltaUnits(row.impact, 0)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t(row.target.hintKey)}
                      {row.effective < row.raw
                        ? ` ${t("simulator.cap", { cap: TARGET_CAP })}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                {t("simulator.noRanges")}
              </p>
            )}
            <button
              type="button"
              onClick={addLever}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand px-3 py-2 text-sm font-medium text-brand-ink hover:bg-brand-soft"
            >
              <Plus size={15} aria-hidden="true" />
              {t("simulator.addRange")}
            </button>
          </div>
          <p className="flex items-start gap-2 border-t border-line px-4 py-2.5 text-xs text-muted">
            <Info size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
            {t("simulator.disclaimer")}
          </p>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <Card title={t("simulator.cardCompare")} className="p-0">
            <div className="px-2 pt-2">
              {a.d ? (
                <ContributionBars current={current} projected={projected} />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-sm text-muted">
                  <p>{t("simulator.noDelivered")}</p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-brand-ink underline underline-offset-2"
                  >
                    {t("common.resetFilters")}
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-3 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-brand" />
                {t("common.current")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm bg-clear" />
                {t("common.projected")}
              </span>
            </div>
          </Card>

          <Card title={t("simulator.cardBreakdown")}>
            {rows.length ? (
              <ul className="space-y-2">
                {rows.map((row) => {
                  const maxAbs = Math.max(
                    ...rows.map((r) => Math.abs(r.impact)),
                    1,
                  );
                  return (
                    <li
                      key={row.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs"
                    >
                      <span className="text-ink">
                        {t(row.target.labelKey)}{" "}
                        <span className="text-muted">
                          {fmtUnits(row.effective, 1)}%
                        </span>
                      </span>
                      <span
                        className={`text-right font-medium tabular-nums ${
                          row.impact >= 0 ? "text-clear-ink" : "text-signal-ink"
                        }`}
                      >
                        {fmtDeltaUnits(row.impact, 0)}
                      </span>
                      <span className="col-span-2 block h-1.5 rounded-full bg-paper">
                        <span
                          className={`block h-1.5 rounded-full ${
                            row.impact >= 0 ? "bg-clear" : "bg-signal"
                          }`}
                          style={{
                            width: `${(Math.abs(row.impact) / maxAbs) * 100}%`,
                          }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                {t("simulator.breakdownEmpty")}
              </p>
            )}
            {rows.length ? (
              <div className="mt-3 flex justify-between border-t border-line pt-2 text-sm">
                <span className="font-medium text-ink">
                  {t("common.totalChange")}
                </span>
                <span
                  className={`font-display font-semibold tabular-nums ${
                    totalImpact >= 0 ? "text-clear-ink" : "text-signal-ink"
                  }`}
                >
                  {fmtDeltaUnits(totalImpact, 0)}
                </span>
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function ContributionBars({
  current,
  projected,
}: {
  current: number;
  projected: number;
}) {
  const { t } = useI18n();
  const data = [
    { label: t("common.current"), value: current, fill: CHART.brand },
    {
      label: t("common.projected"),
      value: projected,
      fill: projected >= 0 ? CHART.clear : CHART.signal,
    },
  ];

  return (
    <div
      role="img"
      aria-label={t("simulator.chartAria")}
      className="h-48"
      data-keyboard-control
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 22, right: 12, bottom: 0, left: 0 }}
          barCategoryGap="35%"
        >
          <CartesianGrid
            vertical={false}
            stroke={CHART.line}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tick={CHART_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={54}
            tickFormatter={(v) => fmtMillions(Number(v))}
            tick={CHART_TICK}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke={CHART.muted} strokeWidth={1.5} />
          <Tooltip
            cursor={{ fill: CHART.brandSoft }}
            contentStyle={CHART_TOOLTIP}
            formatter={(value) => [
              fmtMillions(Number(value)),
              t("common.profit"),
            ]}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.fill} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => fmtMillions(Number(v))}
              style={{ fontSize: 11, fontWeight: 700, fill: CHART.ink }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
