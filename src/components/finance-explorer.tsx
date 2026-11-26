"use client";

import { useState } from "react";
import { Stat } from "@/components/stat";
import type { metrics } from "@/data/metrics";
import {
  fmtInt,
  fmtMillions,
  fmtPct,
  fmtSignedUnits,
  fmtUnits,
} from "@/lib/format";

type Finance = typeof metrics.finance;
type Mode = "order" | "lens";

const MODES: { id: Mode; label: string }[] = [
  { id: "order", label: "Cost per order" },
  { id: "lens", label: "Cost per lens" },
];

export function FinanceExplorer({ finance: f }: { finance: Finance }) {
  const [mode, setMode] = useState<Mode>("order");
  const perLens = mode === "lens";

  const production = perLens ? f.productionPerLens : f.production;
  const costs = [
    { label: "Production", amount: production },
    { label: "Logistics", amount: f.logistics },
    { label: "Incidents", amount: f.incidents },
  ];

  // Floating waterfall: each cost bar starts where the running total ends.
  let run = f.orderValue;
  const bars = [
    { label: "Order value", start: 0, width: f.orderValue, shown: f.orderValue, kind: "plus" },
    ...costs.map((c) => {
      run -= c.amount;
      return {
        label: c.label,
        start: run,
        width: c.amount,
        shown: -c.amount,
        kind: "minus",
      };
    }),
    { label: "Contribution", start: 0, width: run, shown: run, kind: "result" },
  ];

  const barColor: Record<string, string> = {
    plus: "bg-ink",
    minus: "bg-signal",
    result: "bg-clear",
  };

  const negatives = perLens ? f.negLens : f.negOrder;
  const ex = f.example;
  const exProduction = perLens ? ex.production * ex.qty : ex.production;
  const exContribution = perLens ? ex.contribLens : ex.contribOrder;

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
      <section className="rounded-lg border border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Where the money goes, {fmtInt(f.delivered)} delivered orders
            </h2>
            <p className="text-sm text-muted">
              Does the production cost field cover the whole order or each lens?
            </p>
          </div>
          <div className="flex rounded-md border border-line p-0.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  mode === m.id ? "bg-ink text-paper" : "text-muted hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-5 space-y-3">
          {bars.map((b) => (
            <li
              key={b.label}
              className="grid grid-cols-[6.5rem_1fr_5rem] items-center gap-3 text-base"
            >
              <span
                className={b.kind === "result" ? "font-semibold" : "text-muted"}
              >
                {b.label}
              </span>
              <span className="relative block h-8 rounded-sm bg-paper">
                <span
                  className={`absolute inset-y-0 rounded-sm ${barColor[b.kind]}`}
                  style={{
                    left: `${(b.start / f.orderValue) * 100}%`,
                    width: `${(b.width / f.orderValue) * 100}%`,
                  }}
                />
              </span>
              <span
                className={`text-right font-medium tabular-nums ${
                  b.kind === "result" ? "text-xl font-semibold text-clear" : ""
                }`}
              >
                {b.shown < 0 ? "−" : ""}
                {fmtMillions(Math.abs(b.shown))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Amounts shown in € (source currency not stated). Contribution = order
          value − production − logistics − estimated incident cost.
        </p>
      </section>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Stat
            tone="clear"
            value={fmtMillions(run)}
            label="estimated contribution"
            note={perLens ? "production counted per lens" : "production counted per order"}
          />
          <Stat
            tone="signal"
            value={fmtInt(negatives)}
            label="delivered orders lose money"
            note={`${fmtPct(negatives / f.delivered)} of deliveries`}
          />
        </div>
        <Stat
          tone="signal"
          value={`${fmtInt(f.lowPrice.neg)} of ${fmtInt(f.lowPrice.n)}`}
          label="low-price orders have negative contribution"
          note={`${fmtPct(f.lowPrice.neg / f.lowPrice.n)} vs ${fmtPct(f.lowPrice.highNeg / f.lowPrice.highN)} for normally priced orders`}
        />

        <section className="rounded-lg border border-line bg-surface p-4">
          <h3 className="font-display text-lg font-semibold text-ink">
            One order, two answers
          </h3>
          <p className="text-sm text-muted">
            {ex.code} · {ex.store} · {ex.model} · {ex.qty} lenses
          </p>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-sm tabular-nums">
            <dt className="text-muted">Order value</dt>
            <dd className="text-right">{fmtUnits(ex.value, 2)}</dd>
            <dt className="text-muted">
              Production{perLens ? ` (${fmtUnits(ex.production, 2)} × ${ex.qty})` : ""}
            </dt>
            <dd className="text-right">{fmtSignedUnits(-exProduction)}</dd>
            <dt className="text-muted">Logistics</dt>
            <dd className="text-right">{fmtSignedUnits(-ex.logistics)}</dd>
            <dt className="text-muted">Incident</dt>
            <dd className="text-right">{fmtSignedUnits(-ex.incident)}</dd>
            <dt className="border-t border-line pt-1 font-semibold">
              Contribution
            </dt>
            <dd
              className={`border-t border-line pt-1 text-right text-base font-semibold ${
                exContribution < 0 ? "text-signal" : "text-clear"
              }`}
            >
              {fmtSignedUnits(exContribution)}
            </dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
