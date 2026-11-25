"use client";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Focus,
  Glasses,
  Layers,
  Moon,
  ShieldCheck,
  Store,
  Sun,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalysis } from "@/hooks/use-analysis";
import { usePreferences } from "@/hooks/use-preferences";
import { money, number, sumSegments } from "@/lib/analytics";
import type { Network } from "@/types";
import { Simulator } from "./simulator";

export function Dashboard({ data }: { data: Network }) {
  const { all, priority, shops, scenario, result } = useAnalysis(data);
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  const [view, setView] = useState<"shops" | "models">("shops");
  const [selected, setSelected] = useState("O04");
  const shop = shops.find((s) => s.id === selected) ?? shops[0];
  const chart = [
    { nome: shop.cidade, observada: shop.observed, ajustada: shop.adjusted },
    {
      nome: t("Rede", "Network"),
      observada: (100 * all.affected) / all.orders,
      ajustada: (100 * all.affected) / all.orders,
    },
  ];
  const models = data.lenses
    .map((l) => ({
      ...l,
      ...sumSegments(data.segments.filter((s) => s.lens === l.id)),
    }))
    .sort((a, b) => b.incidentCost - a.incidentCost);
  function openSimulator() {
    document.getElementById("simulador")?.scrollIntoView();
  }
  return (
    <>
      <header>
        <div className="shell top">
          <a className="brand" href="#inicio">
            <Glasses size={31} /> Opticmizer
          </a>
          <nav aria-label={t("Navegação principal", "Main navigation")}>
            <a href="#comparar">{t("Comparação", "Comparison")}</a>
            <a href="#simulador">{t("Simulador", "Simulator")}</a>
            <a href="#qualidade">{t("Qualidade dos dados", "Data quality")}</a>
          </nav>
          <div className="preferences">
            <button
              type="button"
              onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
              aria-label={t(
                "Mudar idioma para inglês",
                "Switch language to Portuguese",
              )}
            >
              {language === "pt" ? "PT / EN" : "EN / PT"}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={
                theme === "light"
                  ? t("Ativar tema escuro", "Activate dark theme")
                  : t("Ativar tema claro", "Activate light theme")
              }
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              <span>
                {theme === "light" ? t("Escuro", "Dark") : t("Claro", "Light")}
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="shell" id="inicio">
        <div className="intro">
          <div>
            <p className="label">
              <Focus size={16} /> {t("Operações da rede", "Network operations")}
            </p>
            <h1>{t("Decisões sobre lentes", "Lens decisions")}</h1>
          </div>
          <span className="period">
            <CalendarDays size={16} />{" "}
            {t("Jan 2024 — Dez 2025", "Jan 2024 — Dec 2025")}
          </span>
        </div>
        <div className="metrics">
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
        <div className="feature">
          <div>
            <p className="label">
              {t(
                "Custo das ocorrências associadas",
                "Cost of linked incidents",
              )}
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
              className="cta"
              onClick={() => {
                scenario.reset();
                openSimulator();
              }}
            >
              {t("Simular estes modelos", "Simulate these models")}{" "}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <section className="panel" id="investigar">
          <p className="label">
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
                Math.min(
                  ...data.operatorRates.map((r) => r.affected / r.total),
                ),
              1,
            )}
            % {t("e", "to")}{" "}
            {number(
              100 *
                Math.max(
                  ...data.operatorRates.map((r) => r.affected / r.total),
                ),
              1,
            )}
            %.{" "}
            {t(
              "Os registos apontam para uma investigação do processo e do produto, envolvendo as equipas de produção e qualidade.",
              "The records support investigating the process and product with production and quality teams.",
            )}
          </p>
          <div className="comparison">
            <div>
              <h3>{t("Motivos registados", "Recorded reasons")}</h3>
              <p>
                {t(
                  "Distribuição das ocorrências associadas às L001–L012. Uma encomenda pode ter várias ocorrências.",
                  "Distribution of incidents linked to L001–L012. An order may have multiple incidents.",
                )}
              </p>
              <div className="scroll">
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
              <p className="future">
                {t(
                  "Os dados revelam associações. Não identificam a etapa causadora nem demonstram que uma intervenção reduzirá as ocorrências.",
                  "The data show associations. They do not identify the responsible stage or establish that an intervention will reduce incidents.",
                )}
              </p>
            </div>
          </div>
        </section>
        <section className="panel" id="comparar">
          <div className="sectionhead">
            <div>
              <p className="label">
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
            <div className="switch">
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
            <div className="comparison">
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
                  className="action"
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
                <p className="charttitle">
                  {t(
                    "Encomendas com ocorrência (%)",
                    "Orders with an incident (%)",
                  )}
                </p>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chart}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <CartesianGrid horizontal={false} stroke="var(--line)" />
                      <XAxis
                        type="number"
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
                        dataKey="observada"
                        name={t("Observada", "Observed")}
                        fill="var(--chart)"
                        radius={3}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="ajustada"
                        name={t("Ajustada", "Adjusted")}
                        fill="#cea453"
                        radius={3}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="legend">
                  <span>{t("Observada", "Observed")}</span>
                  <span>
                    {t("Ajustada ao modelo", "Adjusted for model mix")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="scroll">
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
        <Simulator
          data={data}
          scenario={scenario}
          result={result}
          language={language}
        />
        <section id="qualidade" className="panel">
          <p className="label">
            <ShieldCheck size={16} /> {t("Qualidade dos dados", "Data quality")}
          </p>
          <h2>
            {t("O que entra nas contas?", "What goes into the calculations?")}
          </h2>
          <p>
            {t(
              "Uma ocorrência regista um retrabalho, uma devolução, uma substituição ou um ajuste. Uma encomenda conta uma vez na taxa, mesmo quando tem vários registos. Os atrasos resultam da comparação entre datas. A satisfação é recolhida em respostas das óticas.",
              "An incident records rework, a return, a replacement or an adjustment. Each order counts once in the rate, even with multiple incidents. Delays compare delivery dates. Satisfaction comes from optician feedback.",
            )}
          </p>
          <details>
            <summary>
              {number(data.orphans.length)}{" "}
              {t("ocorrências por associar", "unmatched incidents")} ·{" "}
              {money(
                data.orphans.reduce(
                  (v, r) => v + Math.round(r.custo_estimado * 100),
                  0,
                ),
              )}{" "}
              {t("de custo estimado", "in estimated cost")}
            </summary>
            <p>
              {t(
                "Estas ocorrências entram no total do registo. A contribuição individual usa apenas correspondências pelo código integral.",
                "These incidents are included in register totals. Individual contribution uses exact full-code matches only.",
              )}
            </p>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("Ocorrência", "Incident")}</th>
                    <th>{t("Referência", "Reference")}</th>
                    <th>{t("Tipo", "Type")}</th>
                    <th>{t("Custo estimado", "Estimated cost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orphans.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.id_encomenda}</td>
                      <td>
                        {language === "en"
                          ? ((
                              {
                                retrabalho: "rework",
                                devolucao: "return",
                                substituicao: "replacement",
                                ajuste: "adjustment",
                              } as Record<string, string>
                            )[r.tipo_ocorrencia] ?? r.tipo_ocorrencia)
                          : r.tipo_ocorrencia}
                      </td>
                      <td>{money(Math.round(r.custo_estimado * 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>
              {number(data.duplicates)}{" "}
              {t("linhas repetidas retiradas", "duplicate rows removed")}
            </summary>
            <p>
              {t(
                "A limpeza removeu linhas de encomenda integralmente iguais e normalizou",
                "Cleaning removed exact duplicate orders and normalized",
              )}{" "}
              {number(data.convertedDates)}{" "}
              {t(
                "datas de colocação escritas em dia/mês/ano.",
                "order dates written in day/month/year format.",
              )}
            </p>
          </details>
          <p className="future">
            <b>
              {t("Próxima decisão da rede.", "Next decision for the network.")}
            </b>{" "}
            {t(
              "Recolher as datas de expedição e de recolha para perceber onde se acumulam os dias de atraso e planear o reforço da capacidade.",
              "Collect dispatch and carrier collection dates to understand where delays accumulate and plan capacity.",
            )}
          </p>
        </section>
      </main>
    </>
  );
}
