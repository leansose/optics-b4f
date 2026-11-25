"use client";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartColumn,
  Focus,
  Glasses,
  Layers,
  ShieldCheck,
  Store,
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
import { money, number, sumSegments } from "@/lib/analytics";
import type { Network } from "@/types";
import { Simulator } from "./simulator";

export function Dashboard({ data }: { data: Network }) {
  const { all, priority, shops, scenario, result } = useAnalysis(data);
  const [view, setView] = useState<"shops" | "models">("shops");
  const [selected, setSelected] = useState("O04");
  const shop = shops.find((s) => s.id === selected) ?? shops[0];
  const chart = [
    { nome: shop.cidade, observada: shop.observed, ajustada: shop.adjusted },
    {
      nome: "Rede",
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
          <nav aria-label="Navegação principal">
            <a href="#comparar">Comparação</a>
            <a href="#simulador">Simulador</a>
            <a href="#qualidade">Qualidade dos dados</a>
          </nav>
        </div>
      </header>
      <main className="shell" id="inicio">
        <div className="intro">
          <div>
            <p className="label">
              <Focus size={16} /> Operações da rede
            </p>
            <h1>Decisões sobre lentes</h1>
          </div>
          <span className="period">
            <CalendarDays size={16} /> Jan 2024 — Dez 2025
          </span>
        </div>
        <div className="metrics">
          <div>
            <Layers />
            <span>Encomendas distintas</span>
            <strong>{number(all.orders)}</strong>
          </div>
          <div>
            <Store />
            <span>Óticas parceiras</span>
            <strong>{data.shops.length}</strong>
          </div>
          <div>
            <Glasses />
            <span>Modelos analisados</span>
            <strong>{data.lenses.length}</strong>
          </div>
          <div>
            <ArrowDownRight />
            <span>Entregas com atraso ≥ 2 dias</span>
            <strong>{number(all.delayed)}</strong>
          </div>
        </div>
        <div className="feature">
          <div>
            <p className="label">Custo das ocorrências associadas</p>
            <strong>
              {number((100 * priority.incidentCost) / all.incidentCost, 1)}%
            </strong>
          </div>
          <div>
            <h2>Doze modelos concentram a maior parte do custo.</h2>
            <p>
              As progressivas L001–L012 representam{" "}
              {number((100 * priority.orders) / all.orders, 1)}% das encomendas.
              Quanto mudaria a contribuição se o custo das suas ocorrências
              diminuísse?
            </p>
            <button
              type="button"
              className="cta"
              onClick={() => {
                scenario.reset();
                openSimulator();
              }}
            >
              Simular estes modelos <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <section className="panel" id="investigar">
          <p className="label">
            <Focus size={16} /> Investigação das ocorrências
          </p>
          <h2>Onde começar a procurar causas?</h2>
          <p>
            Nos modelos L001–L012, o padrão aparece nos dez operadores. A taxa
            de encomendas com ocorrência varia entre{" "}
            {number(
              100 *
                Math.min(
                  ...data.operatorRates.map((r) => r.affected / r.total),
                ),
              1,
            )}
            % e{" "}
            {number(
              100 *
                Math.max(
                  ...data.operatorRates.map((r) => r.affected / r.total),
                ),
              1,
            )}
            %. Os registos apontam para uma investigação do processo e do
            produto, envolvendo as equipas de produção e qualidade.
          </p>
          <div className="comparison">
            <div>
              <h3>Motivos registados</h3>
              <p>
                Distribuição das ocorrências associadas às L001–L012. Uma
                encomenda pode ter várias ocorrências.
              </p>
              <div className="scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Motivo</th>
                      <th>Ocorrências</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reasons.map((r) => (
                      <tr key={r.name}>
                        <td>{r.name}</td>
                        <td>{number(r.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h3>Hipótese para validar</h3>
              <p>
                Rever fichas dos modelos, medições, montagem e controlos de
                qualidade. Os motivos são distribuídos por várias categorias e
                alguns estão em falta. As duas descrições de graduação podem
                referir-se ao mesmo problema, mas precisam de validação antes de
                serem agrupadas.
              </p>
              <p className="future">
                Os dados revelam associações. Não identificam a etapa causadora
                nem demonstram que uma intervenção reduzirá as ocorrências.
              </p>
            </div>
          </div>
        </section>
        <section className="panel" id="comparar">
          <div className="sectionhead">
            <div>
              <p className="label">
                <ChartColumn size={16} /> Comparação
              </p>
              <h2>
                {view === "shops"
                  ? "Como muda a leitura de cada ótica?"
                  : "Que modelos concentram custos?"}
              </h2>
            </div>
            <div className="switch">
              <button
                type="button"
                aria-pressed={view === "shops"}
                onClick={() => setView("shops")}
              >
                Óticas
              </button>
              <button
                type="button"
                aria-pressed={view === "models"}
                onClick={() => setView("models")}
              >
                Modelos
              </button>
            </div>
          </div>
          {view === "shops" ? (
            <div className="comparison">
              <div>
                <label>
                  Ótica em análise
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
                <h3>{number(shop.affected)} encomendas com ocorrência</h3>
                <p>
                  Em {number(shop.orders)} encomendas, a taxa observada é{" "}
                  {number(shop.observed, 2)}%. Se a ótica vendesse os 50 modelos
                  nas mesmas proporções que a rede, a taxa seria{" "}
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
                  Simular esta ótica <ArrowUpRight size={16} />
                </button>
              </div>
              <div>
                <p className="charttitle">Encomendas com ocorrência (%)</p>
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chart}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <CartesianGrid horizontal={false} stroke="#d8e3e3" />
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
                      <Tooltip formatter={(v) => `${number(Number(v), 2)}%`} />
                      <Bar
                        dataKey="observada"
                        name="Observada"
                        fill="#12675d"
                        radius={3}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="ajustada"
                        name="Ajustada"
                        fill="#cea453"
                        radius={3}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="legend">
                  <span>Observada</span>
                  <span>Ajustada ao modelo</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Modelo",
                      "Complexidade",
                      "Encomendas",
                      "Afetadas",
                      "Custo estimado",
                      "Cenário",
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
                          aria-label={`Simular modelo ${m.id}`}
                        >
                          Simular
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <Simulator data={data} scenario={scenario} result={result} />
        <section id="qualidade" className="panel">
          <p className="label">
            <ShieldCheck size={16} /> Qualidade dos dados
          </p>
          <h2>O que entra nas contas?</h2>
          <p>
            Uma ocorrência regista um retrabalho, uma devolução, uma
            substituição ou um ajuste. Uma encomenda conta uma vez na taxa,
            mesmo quando tem vários registos. Os atrasos resultam da comparação
            entre datas. A satisfação é recolhida em respostas das óticas.
          </p>
          <details>
            <summary>
              {number(data.orphans.length)} ocorrências por associar ·{" "}
              {money(
                data.orphans.reduce(
                  (v, r) => v + Math.round(r.custo_estimado * 100),
                  0,
                ),
              )}{" "}
              de custo estimado
            </summary>
            <p>
              Estas ocorrências entram no total do registo. A contribuição
              individual usa apenas correspondências pelo código integral.
            </p>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Ocorrência</th>
                    <th>Referência</th>
                    <th>Tipo</th>
                    <th>Custo estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orphans.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.id_encomenda}</td>
                      <td>{r.tipo_ocorrencia}</td>
                      <td>{money(Math.round(r.custo_estimado * 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>
              {number(data.duplicates)} linhas repetidas retiradas
            </summary>
            <p>
              A limpeza removeu linhas de encomenda integralmente iguais e
              normalizou {number(data.convertedDates)} datas de colocação
              escritas em dia/mês/ano.
            </p>
          </details>
          <p className="future">
            <b>Próxima decisão da rede.</b> Recolher as datas de expedição e de
            recolha para perceber onde se acumulam os dias de atraso e planear o
            reforço da capacidade.
          </p>
        </section>
      </main>
    </>
  );
}
