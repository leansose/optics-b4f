"use client";
import { ShieldCheck } from "lucide-react";
import { usePreferences } from "@/hooks/use-preferences";
import { money, number } from "@/lib/analytics";
import type { Network } from "@/types";
import { PageShell } from "./page-shell";
import { QualityChart } from "./quality-chart";
export function Quality({
  data,
}: {
  data: Pick<Network, "orphans" | "duplicates" | "convertedDates">;
}) {
  const { language } = usePreferences();
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  return (
    <PageShell
      filters={false}
      title={t("Qualidade dos dados", "Data quality")}
      intro={t(
        "Consulte as regras de limpeza e os limites dos dados usados para calcular os indicadores da rede.",
        "Review the cleaning rules and limitations of the data used to calculate network indicators.",
      )}
    >
      <QualityChart />
      <div className="legacy">
        <section
          id="qualidade"
          className="rounded-xl border border-line bg-surface p-5 md:p-8 last:mb-12 [&>p]:my-3"
        >
          <div className="mb-3 text-green">
            <ShieldCheck size={32} />
          </div>
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
            <div className="max-h-84 overflow-auto">
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
          <details>
            <summary>
              {t("Pressupostos do custeio", "Costing assumptions")}
            </summary>
            <p>
              {t(
                "Apresentamos os valores em euros por convenção do protótipo. A fonte não identifica a moeda. A unidade do custo real de produção também está por confirmar. O simulador permite comparar a aplicação por encomenda e por lente.",
                "Amounts are displayed in euros as a prototype convention. The source does not specify a currency. The production cost unit also needs confirmation. Compare per-order and per-lens costing in the simulator.",
              )}
            </p>
          </details>
          <p className="text-sm text-muted">
            <b>
              {t("Próxima decisão da rede.", "Next decision for the network.")}
            </b>{" "}
            {t(
              "Recolher as datas de expedição e de recolha para perceber onde se acumulam os dias de atraso e planear o reforço da capacidade.",
              "Collect dispatch and carrier collection dates to understand where delays accumulate and plan capacity.",
            )}
          </p>
        </section>
      </div>
    </PageShell>
  );
}
