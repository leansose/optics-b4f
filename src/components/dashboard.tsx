"use client";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Focus,
  Glasses,
  Layers,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalysis } from "@/hooks/use-analysis";
import { usePreferences } from "@/hooks/use-preferences";
import { money, number, sumSegments } from "@/lib/analytics";
import type { Network } from "@/types";

export function Dashboard({ data }: { data: Network }) {
  const router = useRouter();
  const { all, priority, shops, scenario } = useAnalysis(data);
  const { language } = usePreferences();
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  const [view, setView] = useState<"shops" | "models">("shops");
  const [selected, setSelected] = useState("O04");
  const shop = shops.find((s) => s.id === selected) ?? shops[0];
  const chart = [
    {
      nome: t("Observada", "Observed"),
      valor: shop.observed,
      fill: "var(--chart)",
    },
    {
      nome: t("Ajustada", "Adjusted"),
      valor: shop.adjusted,
      fill: "var(--adjusted)",
    },
    {
      nome: t("Rede", "Network"),
      valor: (100 * all.affected) / all.orders,
      fill: "var(--muted)",
    },
  ];
  const models = data.lenses
    .map((l) => ({
      ...l,
      ...sumSegments(data.segments.filter((s) => s.lens === l.id)),
    }))
    .sort((a, b) => b.incidentCost - a.incidentCost);
  function openSimulator() {
    router.push("/simulador/encomendas");
  }
  return (
    <div
      className="legacy mx-auto w-full max-w-[1380px] px-4 sm:px-7 lg:px-12"
      id="inicio"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pt-10 pb-6">
        <div>
          <h1>{t("Comparação de óticas", "Optician comparison")}</h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm">
          <CalendarDays size={16} />{" "}
          {t("Jan 2024 — Dez 2025", "Jan 2024 — Dec 2025")}
        </span>
      </div>
      <div className="my-6 grid grid-cols-2 gap-4 md:grid-cols-4 [&>div]:grid [&>div]:grid-cols-[auto_1fr] [&>div]:items-center [&>div]:gap-x-3 [&_svg]:size-5 [&_svg]:text-green [&_span]:text-sm [&_span]:text-muted [&_strong]:col-start-2 [&_strong]:text-3xl">
        <div>
          <Layers />
          <span>{t("Encomendas distintas", "Distinct orders")}</span>
          <strong>{number(all.orders)}</strong>
        </div>
        <div>
          <Store />
          <span>{t("Óticas parceiras", "Partner opticians")}</span>
          <strong>{data.shops.length}</strong>
        </div>
        <div>
          <Glasses />
          <span>{t("Modelos analisados", "Lens models")}</span>
          <strong>{data.lenses.length}</strong>
        </div>
        <div>
          <ArrowDownRight />
          <span>
            {t("Entregas com atraso ≥ 2 dias", "Deliveries ≥ 2 days late")}
          </span>
          <strong>{number(all.delayed)}</strong>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-line py-4 [&_b]:block [&_b]:text-xl [&_small]:text-muted">
        <span>
          {t("Vendas nas entregas", "Delivered sales")}{" "}
          <b>{money(all.sales)}</b>
        </span>
        <span>
          {t(
            "Contribuição estimada por entrega¹",
            "Estimated contribution per delivery¹",
          )}{" "}
          <b>
            {money(
              (all.sales -
                all.production -
                all.shipping -
                all.deliveredIncidentCost) /
                all.delivered,
            )}
          </b>
        </span>
        <small>
          {t(
            "¹ Produção custeada por encomenda.",
            "¹ Production cost applied per order.",
          )}
        </small>
      </div>
      <div className="grid items-center gap-6 rounded-2xl bg-onyx p-6 text-dust md:grid-cols-[1fr_2fr] md:p-9 [&_strong]:text-6xl md:[&_strong]:text-7xl [&_p]:my-3">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            {t("Custo das ocorrências associadas", "Cost of linked incidents")}
          </p>
          <strong>
            {number((100 * priority.incidentCost) / all.incidentCost, 1)}%
          </strong>
        </div>
        <div>
          <h2>
            {t(
              "Doze modelos concentram a maior parte do custo.",
              "Twelve models account for most of the cost.",
            )}
          </h2>
          <p>
            {t(
              "As progressivas L001–L012 representam",
              "Progressive models L001–L012 represent",
            )}{" "}
            {number((100 * priority.orders) / all.orders, 1)}%{" "}
            {t(
              "das encomendas. Quanto mudaria a contribuição se o custo das suas ocorrências diminuísse?",
              "of orders. How would contribution change if their incident costs fell?",
            )}
          </p>
          <button
            type="button"
            className="border-0 bg-dust font-semibold text-onyx"
            onClick={() => {
              scenario.reset();
              scenario.change({ lens: "priority" });
              openSimulator();
            }}
          >
            {t("Simular estes modelos", "Simulate these models")}{" "}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
      <section
        className="my-5 rounded-xl border border-line bg-surface p-5 md:p-8 last:mb-12 [&>p]:my-3"
        id="comparar"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ChartColumn size={16} /> {t("Comparação", "Comparison")}
            </p>
            <h2>
              {view === "shops"
                ? t(
                    "Como muda a leitura de cada ótica?",
                    "How does each optician compare?",
                  )
                : t(
                    "Que modelos concentram custos?",
                    "Which models account for the most cost?",
                  )}
            </h2>
          </div>
          <div className="flex rounded-lg bg-surface-soft p-1 [&_button]:border-0 [&_button]:bg-transparent [&_button[aria-pressed=true]]:bg-switch-active [&_button[aria-pressed=true]]:text-on-accent">
            <button
              type="button"
              aria-pressed={view === "shops"}
              onClick={() => setView("shops")}
            >
              {t("Óticas", "Opticians")}
            </button>
            <button
              type="button"
              aria-pressed={view === "models"}
              onClick={() => setView("models")}
            >
              {t("Modelos", "Models")}
            </button>
          </div>
        </div>
        {view === "shops" ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10">
            <div>
              <label>
                {t("Ótica em análise", "Selected optician")}
                <select
                  value={shop.id}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.cidade}
                    </option>
                  ))}
                </select>
              </label>
              <h3>
                {number(shop.affected)}{" "}
                {t("encomendas com ocorrência", "orders with an incident")}
              </h3>
              <p>
                {t("Em", "Among")} {number(shop.orders)}{" "}
                {t(
                  "encomendas, a taxa observada é",
                  "orders, the observed rate is",
                )}{" "}
                {number(shop.observed, 2)}%.{" "}
                {t(
                  "Se a ótica vendesse os 50 modelos nas mesmas proporções que a rede, a taxa seria",
                  "With the same mix of all 50 models as the network, the rate would be",
                )}{" "}
                {number(shop.adjusted, 2)}%.
              </p>
              <button
                type="button"
                className="mt-4 font-semibold text-green"
                onClick={() => {
                  scenario.change({ shop: shop.id, lens: "all" });
                  openSimulator();
                }}
              >
                {t("Simular esta ótica", "Simulate this optician")}{" "}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {t(
                  "Encomendas com ocorrência (%)",
                  "Orders with an incident (%)",
                )}
              </p>
              <div className="mt-3 h-40 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chart}
                    layout="vertical"
                    margin={{ left: 8, right: 48 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--line)" />
                    <XAxis
                      type="number"
                      domain={[
                        0,
                        Math.ceil(
                          Math.max(
                            ...shops.map((r) =>
                              Math.max(r.observed, r.adjusted),
                            ),
                          ),
                        ),
                      ]}
                      tickFormatter={(v) => `${number(v)}%`}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      width={78}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface)",
                        borderColor: "var(--line)",
                        color: "var(--ink)",
                      }}
                      formatter={(v) => `${number(Number(v), 2)}%`}
                    />
                    <Bar
                      dataKey="valor"
                      name={t("Taxa", "Rate")}
                      barSize={16}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="valor"
                        position="right"
                        fill="var(--ink)"
                        formatter={(v) => `${number(Number(v), 2)}%`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-84 overflow-auto">
            <table>
              <thead>
                <tr>
                  {[
                    t("Modelo", "Model"),
                    t("Complexidade", "Complexity"),
                    t("Encomendas", "Orders"),
                    t("Afetadas", "Affected"),
                    t("Custo estimado", "Estimated cost"),
                    t("Cenário", "Scenario"),
                  ].map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id}>
                    <th>{m.id}</th>
                    <td>{m.complexidade}</td>
                    <td>{number(m.orders)}</td>
                    <td>{number((100 * m.affected) / m.orders, 2)}%</td>
                    <td>{money(m.incidentCost)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          scenario.change({ lens: m.id, shop: "all" });
                          openSimulator();
                        }}
                        aria-label={`${t("Simular modelo", "Simulate model")} ${m.id}`}
                      >
                        {t("Simular", "Simulate")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section
        className="my-5 rounded-xl border border-line bg-surface p-5 md:p-8 last:mb-12 [&>p]:my-3"
        id="investigar"
      >
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Focus size={16} />{" "}
          {t("Investigação das ocorrências", "Incident investigation")}
        </p>
        <h2>
          {t(
            "Onde começar a procurar causas?",
            "Where should we investigate causes?",
          )}
        </h2>
        <p>
          {t(
            "Nos modelos L001–L012, o padrão aparece nos dez operadores. A taxa de encomendas com ocorrência varia entre",
            "For models L001–L012, the pattern appears across all ten operators. The share of orders with an incident ranges from",
          )}{" "}
          {number(
            100 *
              Math.min(...data.operatorRates.map((r) => r.affected / r.total)),
            1,
          )}
          % {t("e", "to")}{" "}
          {number(
            100 *
              Math.max(...data.operatorRates.map((r) => r.affected / r.total)),
            1,
          )}
          %.{" "}
          {t(
            "Os registos apontam para uma investigação do processo e do produto, envolvendo as equipas de produção e qualidade.",
            "The records support investigating the process and product with production and quality teams.",
          )}
        </p>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10">
          <div>
            <h3>{t("Motivos registados", "Recorded reasons")}</h3>
            <p>
              {t(
                "Distribuição das ocorrências associadas às L001–L012. Uma encomenda pode ter várias ocorrências.",
                "Distribution of incidents linked to L001–L012. An order may have multiple incidents.",
              )}
            </p>
            <div className="max-h-84 overflow-auto">
              <table>
                <thead>
                  <tr>
                    <th>{t("Motivo", "Reason")}</th>
                    <th>{t("Ocorrências", "Incidents")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reasons.map((r) => (
                    <tr key={r.name}>
                      <td>
                        {language === "en"
                          ? ((
                              {
                                "Não registado": "Not recorded",
                                "erro de graduacao": "prescription error",
                                "graduacao errada": "incorrect prescription",
                                "lente riscada": "scratched lens",
                                montagem: "assembly",
                                desconforto: "discomfort",
                                avaria: "damage",
                                "tinte desigual": "uneven tint",
                              } as Record<string, string>
                            )[r.name] ?? r.name)
                          : r.name}
                      </td>
                      <td>{number(r.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3>{t("Hipótese para validar", "Hypothesis to investigate")}</h3>
            <p>
              {t(
                "Rever fichas dos modelos, medições, montagem e controlos de qualidade. Os motivos são distribuídos por várias categorias e alguns estão em falta. As duas descrições de graduação podem referir-se ao mesmo problema, mas precisam de validação antes de serem agrupadas.",
                "Review model specifications, measurements, assembly and quality checks. Reasons span several categories and some are missing. The two prescription descriptions may refer to the same issue and need validation before grouping.",
              )}
            </p>
            <p className="text-sm text-muted">
              {t(
                "Os dados revelam associações. Não identificam a etapa causadora nem demonstram que uma intervenção reduzirá as ocorrências.",
                "The data show associations. They do not identify the responsible stage or establish that an intervention will reduce incidents.",
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
