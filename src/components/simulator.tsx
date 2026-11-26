import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Language } from "@/hooks/use-preferences";
import {
  beforeIncident,
  matchesSelection,
  money,
  number,
  type simulate,
} from "@/lib/analytics";
import type { Network, Scenario } from "@/types";
import { DecisionTable } from "./decision-table";

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() !== "" && Number.isFinite(Number(draft)))
      onChange(
        Math.max(min, Math.min(max, Math.round(Number(draft) * 10) / 10)),
      );
    setDraft(null);
  };
  return (
    <div className="my-4">
      <div className="mb-2 flex items-center gap-2 [&_label]:flex-1">
        <label htmlFor={id}>{label}</label>
        <input
          aria-label={`${label} (%)`}
          type="number"
          step="0.1"
          min={min}
          max={max}
          value={draft ?? value}
          onChange={(e) => {
            const raw = e.currentTarget.value;
            setDraft(raw);
            const n = e.currentTarget.valueAsNumber;
            if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />{" "}
        %
      </div>
      <input
        id={id}
        type="range"
        step="0.1"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          setDraft(null);
          onChange(e.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
}

export function Simulator({
  data,
  scenario: s,
  result,
  language,
}: {
  data: Network;
  language: Language;
  scenario: Scenario & {
    change: (v: Partial<Scenario>) => void;
    reset: () => void;
  };
  result: ReturnType<typeof simulate>;
}) {
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  const [showOrders, setShowOrders] = useState(false);
  const [query, setQuery] = useState("");
  const term = query.trim().toUpperCase();
  const selected = useMemo(
    () => data.orderDetails.filter((o) => matchesSelection(o, s.shop, s.lens)),
    [data, s.shop, s.lens],
  );
  const crossings = useMemo(
    () =>
      selected.filter((o) => {
        const before = beforeIncident(o, s.unit);
        return before >= 0 && before < o.incident;
      }),
    [selected, s.unit],
  );
  const adjustments = crossings.filter((o) => o.adjustmentOnly);
  const order = term
    ? selected.find(
        (o) =>
          o.code.toUpperCase() === term || o.recordId?.toUpperCase() === term,
      )
    : (adjustments[0] ?? crossings[0] ?? selected[0]);
  return (
    <div id="simulador">
      <section className="my-5 rounded-xl border border-line bg-surface p-5 md:p-8 last:mb-12 [&>p]:my-3">
        <div className="grid gap-4 md:grid-cols-3 [&_select]:w-full">
          <label>
            {t("Ótica", "Optician")}
            <select
              value={s.shop}
              onChange={(e) => s.change({ shop: e.target.value })}
            >
              <option value="all">{t("Toda a rede", "Entire network")}</option>
              {data.shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.cidade}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Modelo", "Model")}
            <select
              value={s.lens}
              onChange={(e) => s.change({ lens: e.target.value })}
            >
              <option value="priority">
                {t("Progressivas L001–L012", "Progressive L001–L012")}
              </option>
              <option value="all">{t("Todos os modelos", "All models")}</option>
              {data.lenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} ·{" "}
                  {language === "en"
                    ? ((
                        {
                          progressiva: "progressive",
                          unifocal: "single vision",
                          bifocal: "bifocal",
                          fotocromatica: "photochromic",
                          tratamento_especial: "special treatment",
                        } as Record<string, string>
                      )[l.categoria] ?? l.categoria)
                    : l.categoria}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Custo de produção aplicado", "Production cost applied")}
            <select
              value={s.unit ? "lens" : "order"}
              onChange={(e) => s.change({ unit: e.target.value === "lens" })}
            >
              <option value="order">{t("Por encomenda", "Per order")}</option>
              <option value="lens">{t("Por lente", "Per lens")}</option>
            </select>
          </label>
        </div>
        <DecisionTable
          data={data}
          crossings={crossings.length}
          scenario={s}
          result={result}
          language={language}
        />
        <details onToggle={(event) => setShowOrders(event.currentTarget.open)}>
          <summary>
            {t(
              "Consultar encomendas e ponto de equilíbrio",
              "Inspect orders and break-even point",
            )}
          </summary>
          <p>
            {t(
              `Das ${number(crossings.length)} entregas que passaram a contribuição negativa, ${number(adjustments.length)} tiveram apenas ajustes.`,
              `Of the ${number(crossings.length)} deliveries crossing below zero, ${number(adjustments.length)} had adjustments only.`,
            )}
          </p>
          {showOrders && crossings.length > 0 && (
            <label>
              {t("Escolher uma encomenda afetada", "Choose an affected order")}
              <select
                value={
                  crossings.some((o) => o.code === order?.code)
                    ? order?.code
                    : ""
                }
                onChange={(e) => setQuery(e.target.value)}
              >
                <option value="" disabled>
                  {t("Selecionar", "Select")}
                </option>
                {crossings.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code}
                    {o.adjustmentOnly ? t(" (ajuste)", " (adjustment)") : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            {t("Referência ou ID da encomenda", "Order reference or ID")}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(
                "Ex. E000017 ou 2024/000017",
                "E.g. E000017 or 2024/000017",
              )}
            />
          </label>
          {order &&
            beforeIncident(order, s.unit) >= 0 &&
            beforeIncident(order, s.unit) < order.incident && (
              <p>
                <b>
                  {t(
                    "Redução necessária para atingir o equilíbrio",
                    "Reduction needed to break even",
                  )}{" "}
                  {money(order.incident - beforeIncident(order, s.unit))}
                </b>{" "}
                (
                {number(
                  (100 * (order.incident - beforeIncident(order, s.unit))) /
                    order.incident,
                  1,
                )}
                %{" "}
                {t(
                  "do custo desta ocorrência ou conjunto de ocorrências",
                  "of this order’s incident costs",
                )}
                ).
              </p>
            )}
          {order ? (
            <p>
              {order.recordId} · {order.code} · {order.quantity}{" "}
              {t("lentes. Valor", "lenses. Value")} {money(order.sales)},{" "}
              {t("produção", "production")}{" "}
              {money(order.production * (s.unit ? order.quantity : 1))},{" "}
              {t("logística", "shipping")} {money(order.shipping)}{" "}
              {t("e ocorrências", "and incidents")} {money(order.incident)}.{" "}
              {t("Contribuição estimada", "Estimated contribution")}{" "}
              <b>
                {money(
                  order.sales -
                    order.production * (s.unit ? order.quantity : 1) -
                    order.shipping -
                    order.incident,
                )}
              </b>
              .
            </p>
          ) : (
            <p>
              {t(
                "Sem encomenda entregue com esse código. Introduz o código completo.",
                "No delivered order matches that code. Enter the full code.",
              )}
            </p>
          )}
        </details>
      </section>
      <section className="my-5 rounded-xl border border-line bg-surface p-5 md:p-8 last:mb-12 [&>p]:my-3">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2>
            <SlidersHorizontal size={23} />{" "}
            {t("Testar uma alteração", "Test a change")}
          </h2>
          <button
            type="button"
            onClick={() =>
              s.change({ reduction: 0, priceChange: 0, productionChange: 0 })
            }
          >
            <RotateCcw size={15} />
            {t("Repor valores", "Reset values")}
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <Slider
              label={t(
                "Redução do custo das ocorrências",
                "Reduction in incident cost",
              )}
              min={0}
              max={50}
              value={s.reduction}
              onChange={(reduction) => s.change({ reduction })}
            />
            <Slider
              label={t(
                "Variação do custo de produção",
                "Change in production cost",
              )}
              min={-25}
              max={25}
              value={s.productionChange}
              onChange={(productionChange) => s.change({ productionChange })}
            />
            <Slider
              label={t("Variação do valor de venda", "Change in order value")}
              min={-20}
              max={20}
              value={s.priceChange}
              onChange={(priceChange) => s.change({ priceChange })}
            />
          </div>
          <div
            className="min-w-0 rounded-xl bg-surface-soft p-5 [&_strong]:text-4xl [&_dl]:my-4 [&_dl]:grid [&_dl]:grid-cols-[1fr_auto] [&_dl]:gap-2 [&_dd]:font-semibold"
            aria-live="polite"
          >
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              {t("Variação da contribuição", "Change in contribution")}
            </p>
            <strong>
              {result.delta > 0 ? "+" : ""}
              {money(result.delta)}
            </strong>
            <p>
              {number(result.t.delivered)}{" "}
              {t(
                "encomendas entregues no cenário",
                "delivered orders in this scenario",
              )}
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  accessibilityLayer
                  data={[
                    {
                      name: t("Histórico", "Historical"),
                      value: result.base / 100,
                    },
                    {
                      name: t("Cenário", "Scenario"),
                      value: result.projected / 100,
                    },
                  ]}
                  margin={{ top: 8, left: 2, right: 8, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} />
                  <YAxis
                    width={64}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(
                        language === "pt" ? "pt-PT" : "en-IE",
                        {
                          notation: "compact",
                          style: "currency",
                          currency: "EUR",
                          maximumFractionDigits: 1,
                        },
                      ).format(v)
                    }
                  />
                  <ReferenceLine y={0} stroke="var(--muted)" />
                  <Tooltip
                    formatter={(v) => money(Number(v) * 100)}
                    contentStyle={{
                      background: "var(--surface)",
                      color: "var(--ink)",
                      borderColor: "var(--line)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name={t("Contribuição", "Contribution")}
                    fill="var(--chart)"
                    maxBarSize={64}
                    radius={3}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <dl>
              <dt>{t("Contribuição histórica", "Historical contribution")}</dt>
              <dd>{money(result.base)}</dd>
              <dt>{t("Contribuição simulada", "Simulated contribution")}</dt>
              <dd>{money(result.projected)}</dd>
              <dt>
                {t(
                  "Custo histórico das ocorrências",
                  "Historical incident cost",
                )}
              </dt>
              <dd>{money(result.t.deliveredIncidentCost)}</dd>
            </dl>
            <small>
              {t(
                "Simulação a volume constante, apresentada em euros. A unidade do custo de produção está por confirmar.",
                "Simulation at constant volume, displayed in euros. The production cost unit remains to be confirmed.",
              )}
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}
