"use client";

import {
  CircleDollarSign,
  Info,
  TagX,
  TriangleExclamationPoint,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type DropdownOption,
  FilterDropdown,
} from "@/components/filter-dropdown";
import { OrderPicker } from "@/components/order-picker";
import { Card, PageShell } from "@/components/page-shell";
import { metrics } from "@/data/metrics";
import { CHART, CHART_TICK, CHART_TOOLTIP } from "@/lib/chart-theme";
import { aggregate, type Filters, MODELS, SHOPS } from "@/lib/cube";
import { useFilters } from "@/lib/filters";
import { useFormat } from "@/lib/format";
import { type TranslationKey, useI18n } from "@/lib/i18n";
import { decodeOrder, ordersFor } from "@/lib/orders";

type Mode = "order" | "lens";

const MODES: { id: Mode; shortKey: TranslationKey }[] = [
  { id: "order", shortKey: "common.perOrder" },
  { id: "lens", shortKey: "common.perLens" },
];

type Tone = "ink" | "signal" | "clear";
const toneText: Record<Tone, string> = {
  ink: "text-brand-ink",
  signal: "text-signal-ink",
  clear: "text-clear-ink",
};
const toneLine: Record<Tone, string> = {
  ink: "border-t-brand",
  signal: "border-t-signal",
  clear: "border-t-clear",
};

function Metric({
  value,
  label,
  note,
  icon,
  tone = "ink",
}: {
  value: string;
  label: string;
  note?: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  return (
    <div
      className={`rounded-[var(--card-radius)] border-x border-b border-line border-t-[3px] bg-surface p-4 shadow-[var(--card-shadow)] ${toneLine[tone]}`}
    >
      <div className="flex items-center gap-2">
        <span className={`shrink-0 ${toneText[tone]}`}>{icon}</span>
        <p className="text-xs font-medium text-muted">{label}</p>
      </div>
      <p
        className={`mt-2 font-display text-[1.875rem] leading-[1.05] font-semibold tracking-[-0.02em] tabular-nums ${toneText[tone]}`}
      >
        {value}
      </p>
      {note ? <p className="mt-1.5 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

type FlowStep = {
  label: string;
  span: [number, number];
  signed: number;
  fill: string;
};

function WaterfallChart({
  value,
  costs,
  contribution,
}: {
  value: number;
  costs: { label: string; amount: number }[];
  contribution: number;
}) {
  const { t } = useI18n();
  const { fmtMillions } = useFormat();
  const signedMillions = (n: number) =>
    `${n < 0 ? "−" : ""}${fmtMillions(Math.abs(n))}`;

  let running = value;
  const steps: FlowStep[] = [
    {
      label: t("common.orderValue"),
      span: [0, value],
      signed: value,
      fill: CHART.brand,
    },
    ...costs.map((c) => {
      const to = running - c.amount;
      const from = running;
      running = to;
      return {
        label: c.label,
        span: [to, from] as [number, number],
        signed: -c.amount,
        fill: CHART.signal,
      };
    }),
    {
      label: t("common.contribution"),
      span: [Math.min(0, contribution), Math.max(0, contribution)],
      signed: contribution,
      fill: contribution < 0 ? CHART.signalInk : CHART.clear,
    },
  ];

  return (
    <figure
      aria-label={t("finance.waterfallAria")}
      className="h-64 min-w-0"
      data-keyboard-control
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={steps}
          margin={{ top: 26, right: 12, bottom: 0, left: 0 }}
          barCategoryGap="28%"
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
            minTickGap={10}
          />
          <YAxis
            width="auto"
            tickFormatter={(v) => fmtMillions(Number(v))}
            tick={CHART_TICK}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={0} stroke={CHART.muted} strokeWidth={1.5} />
          <Tooltip
            cursor={{ fill: CHART.brandSoft }}
            content={({ active, payload, label }) => {
              const step = payload?.find(
                (p) => typeof p.payload?.signed === "number",
              )?.payload as FlowStep | undefined;
              if (!active || !step) return null;
              return (
                <div style={CHART_TOOLTIP} className="px-3 py-2">
                  <p className="font-medium text-ink">{label}</p>
                  <p className="mt-0.5 tabular-nums text-muted">
                    {signedMillions(step.signed)}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="span" isAnimationActive={false} radius={[5, 5, 0, 0]}>
            <LabelList
              dataKey="signed"
              position="top"
              formatter={(v) => signedMillions(Number(v))}
              style={{ fontSize: "0.8rem", fontWeight: 700, fill: CHART.ink }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function FinanceDashboard() {
  const { fmtInt, fmtMillions, fmtPct, fmtSignedUnits, fmtUnits } = useFormat();
  const { filters, reset } = useFilters();
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("order");
  const [selectedCode, setSelectedCode] = useState(
    metrics.finance.example.code,
  );
  const [inspectFilters, setInspectFilters] = useState<Filters>(() => ({
    shop: filters.shop,
    year: filters.year,
    model: filters.model,
  }));
  const a = useMemo(() => aggregate(filters), [filters]);
  const inspectOrders = useMemo(
    () => ordersFor(inspectFilters),
    [inspectFilters],
  );
  const perLens = mode === "lens";

  // Start from the global filters, then let this card diverge on its own.
  useEffect(() => {
    setInspectFilters((prev) =>
      prev.shop === filters.shop &&
      prev.year === filters.year &&
      prev.model === filters.model
        ? prev
        : { shop: filters.shop, year: filters.year, model: filters.model },
    );
  }, [filters.shop, filters.year, filters.model]);

  const modeLabel = (m: Mode) =>
    t(m === "order" ? "finance.modeOrder" : "finance.modeLens");

  const production = perLens ? a.pl : a.p;
  const contribution = a.v - production - a.lg - a.oc;
  const negatives = perLens ? a.nL : a.nO;
  const lowNeg = perLens ? a.lowNegL : a.lowNegO;
  const highN = a.d - a.lowN;
  const highNeg = negatives - lowNeg;

  const costs = [
    { label: t("common.production"), amount: production },
    { label: t("common.logistics"), amount: a.lg },
    { label: t("common.incidents"), amount: a.oc },
  ];
  const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);

  const inspectShopOptions: DropdownOption<number | null>[] = [
    { label: t("common.all"), value: null },
    ...SHOPS.map((s, i) => ({ label: s.name, value: i })),
  ];
  const inspectModelOptions: DropdownOption<number | null>[] = [
    { label: t("common.all"), value: null },
    ...MODELS.map((m) => ({ label: m.label, value: m.id })),
  ];

  const selectedRow =
    inspectOrders.find((row) => row[0] === selectedCode) ?? inspectOrders[0];
  const ex = selectedRow ? decodeOrder(selectedRow) : null;
  const exProd = ex ? (perLens ? ex.production * ex.qty : ex.production) : 0;
  const exContribution = ex
    ? ex.value - exProd - ex.logistics - ex.incident
    : 0;

  return (
    <PageShell intro={t("intro.finance")} title={t("finance.title")}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          tone="clear"
          icon={<CircleDollarSign size={16} aria-hidden="true" />}
          value={a.d ? fmtMillions(contribution) : "–"}
          label={t("finance.metricContribution")}
          note={t("finance.contributionNote", {
            orders: fmtInt(a.d),
            basis: modeLabel(mode).toLowerCase(),
          })}
        />
        <Metric
          tone="signal"
          icon={<TriangleExclamationPoint size={16} aria-hidden="true" />}
          value={fmtInt(negatives)}
          label={t("finance.metricLosing")}
          note={
            a.d
              ? t("finance.deliveriesNote", {
                  share: fmtPct(negatives / a.d),
                })
              : undefined
          }
        />
        <Metric
          tone="signal"
          icon={<TagX size={16} aria-hidden="true" />}
          value={
            a.lowN
              ? `${fmtInt(lowNeg)} ${t("common.of")} ${fmtInt(a.lowN)}`
              : "–"
          }
          label={t("finance.metricLowPrice")}
          note={
            a.lowN && highN
              ? t("finance.lowNote", {
                  low: fmtPct(lowNeg / a.lowN),
                  high: fmtPct(highNeg / highN),
                })
              : undefined
          }
        />
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="flex min-h-0 flex-col p-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-4 pb-3">
            <div>
              <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">
                {t("finance.cardFlow")}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {t("finance.flowSub")}
              </p>
            </div>
            <fieldset className="inline-flex rounded-[var(--control-radius)] bg-panel p-0.5 ring-1 ring-line">
              <legend className="sr-only">{t("finance.costUnit")}</legend>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mode === m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-[8px] px-3 py-1.5 text-[0.8125rem] font-medium transition-colors ${
                    mode === m.id
                      ? "bg-surface text-brand-ink shadow-[0_1px_2px_rgba(38,61,84,0.14)]"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t(m.shortKey)}
                </button>
              ))}
            </fieldset>
          </div>

          {a.d ? (
            <>
              <div className="px-2 pt-1">
                <WaterfallChart
                  value={a.v}
                  costs={costs}
                  contribution={contribution}
                />
              </div>
              {totalCost > 0 ? (
                <div className="mx-4 mt-1">
                  <p className="mb-1 text-xs font-medium text-muted">
                    {t("finance.costMix")}
                  </p>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-paper ring-1 ring-line">
                    {costs.map((c, i) => (
                      <span
                        key={c.label}
                        title={`${c.label}: ${fmtMillions(c.amount)}`}
                        className={
                          i === 0
                            ? "bg-signal"
                            : i === 1
                              ? "bg-brand"
                              : "bg-neutral"
                        }
                        style={{ width: `${(c.amount / totalCost) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                    {costs.map((c, i) => (
                      <span key={c.label}>
                        <span
                          className={`mr-1 inline-block size-1.5 rounded-full ${
                            i === 0
                              ? "bg-signal"
                              : i === 1
                                ? "bg-brand"
                                : "bg-neutral"
                          }`}
                        />
                        {c.label} {fmtPct(c.amount / totalCost, 0)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 pb-2 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: CHART.brand }}
                  />
                  {t("common.orderValue")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: CHART.signal }}
                  />
                  {t("common.costs")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{ background: CHART.clear }}
                  />
                  {t("common.contribution")}
                </span>
                <span>{t("finance.transparent")}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
              <p>{t("finance.noOrdersSelection")}</p>
              <button
                type="button"
                onClick={reset}
                className="text-brand-ink underline underline-offset-2"
              >
                {t("common.resetFilters")}
              </button>
            </div>
          )}
          <p className="flex items-start gap-2 border-t border-line px-4 py-2.5 text-xs text-muted">
            <Info size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
            {t("finance.currencyNote")}
          </p>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <Card title={t("finance.cardInspect")}>
            <p className="mb-2 text-xs font-medium text-muted">
              {t("finance.inspectFilters")}
            </p>
            <div className="flex flex-wrap gap-2" data-keyboard-control>
              <FilterDropdown
                label={t("dm.optician")}
                value={inspectFilters.shop}
                options={inspectShopOptions}
                onChange={(shop) => setInspectFilters((f) => ({ ...f, shop }))}
                className="min-w-[150px] flex-1"
              />
              <FilterDropdown
                label={t("dm.model")}
                value={inspectFilters.model}
                options={inspectModelOptions}
                onChange={(model) =>
                  setInspectFilters((f) => ({ ...f, model }))
                }
                className="min-w-[150px] flex-1"
              />
            </div>
            {ex ? (
              <>
                <div className="mt-2">
                  <OrderPicker
                    orders={inspectOrders}
                    value={ex.code}
                    onChange={setSelectedCode}
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={`font-display text-lg font-semibold tabular-nums ${
                      exContribution < 0 ? "text-signal-ink" : "text-clear-ink"
                    }`}
                  >
                    {exContribution < 0
                      ? t("finance.loses")
                      : t("finance.earns")}{" "}
                    {fmtUnits(Math.abs(exContribution), 2)}{" "}
                    {t("finance.perUnit", {
                      unit: t(perLens ? "common.lens" : "common.order"),
                    })}
                  </p>
                  <p className="text-xs text-muted">{ex.year}</p>
                </div>
                <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm tabular-nums">
                  <dt className="text-muted">{t("common.orderValue")}</dt>
                  <dd className="text-right">{fmtUnits(ex.value, 2)}</dd>
                  <dt className="text-muted">
                    {t("common.production")}
                    {ex.qty > 1
                      ? ` (${fmtUnits(ex.production, 2)} × ${ex.qty})`
                      : ""}
                  </dt>
                  <dd className="text-right">{fmtSignedUnits(-exProd)}</dd>
                  <dt className="text-muted">{t("common.logistics")}</dt>
                  <dd className="text-right">
                    {fmtSignedUnits(-ex.logistics)}
                  </dd>
                  <dt className="text-muted">{t("common.incident")}</dt>
                  <dd className="text-right">{fmtSignedUnits(-ex.incident)}</dd>
                </dl>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                  {[
                    {
                      label: t("common.perOrder"),
                      value:
                        ex.value - ex.production - ex.logistics - ex.incident,
                    },
                    {
                      label: t("common.perLens"),
                      value:
                        ex.value -
                        ex.production * ex.qty -
                        ex.logistics -
                        ex.incident,
                    },
                  ].map((r) => (
                    <div key={r.label} className="rounded-lg bg-paper p-2">
                      <p className="text-xs text-muted">{r.label}</p>
                      <p
                        className={`font-display text-lg font-semibold tabular-nums ${
                          r.value < 0 ? "text-signal-ink" : "text-clear-ink"
                        }`}
                      >
                        {fmtSignedUnits(r.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-2 text-sm text-muted">
                <p>{t("finance.noOrdersFilters")}</p>
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
      </div>
    </PageShell>
  );
}
