import type { Language } from "@/hooks/use-preferences";
import { matchesSelection, number, type simulate } from "@/lib/analytics";
import type { Network, Scenario } from "@/types";

export function DecisionTable({
  data,
  scenario,
  result,
  language,
  crossings,
}: {
  data: Network;
  scenario: Scenario;
  result: ReturnType<typeof simulate>;
  language: Language;
  crossings: number;
}) {
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  const pct = (value: number) => `${number(value * 100, 1)}%`;
  const totals = result.t;
  const marginBefore = totals.sales
    ? (result.base + totals.deliveredIncidentCost) / totals.sales
    : 0;
  const reviews = data.reviews.filter((r) =>
    matchesSelection(r, scenario.shop, scenario.lens),
  );
  const count = reviews.reduce((n, r) => n + r.count, 0);
  const score = count ? reviews.reduce((n, r) => n + r.score, 0) / count : 0;
  const themes: Record<string, number> = {};
  for (const row of reviews)
    for (const [k, n] of Object.entries(row.lowThemes))
      themes[k] = (themes[k] ?? 0) + n;
  const top = Object.entries(themes).sort((a, b) => b[1] - a[1])[0];
  const labels: Record<string, string> = {
    entrega: t("entrega", "delivery"),
    preco: t("preço", "price"),
    produto: t("produto", "product"),
    qualidade: t("qualidade", "quality"),
    atendimento: t("atendimento", "service"),
  };
  const lowMargin = totals.sales > 0 && marginBefore < 0.1;
  const expensive =
    (scenario.unit ? totals.perLens : totals.production) > totals.catalogCost;
  const priority = lowMargin
    ? t(
        "Rever a margem de venda antes das ocorrências.",
        "Review sales margin before incidents.",
      )
    : crossings
      ? t(
          "Investigar as ocorrências que absorveram a margem.",
          "Investigate incidents that consumed the order margin.",
        )
      : count >= 10 && score < 4
        ? t(
            "Rever o feedback com as óticas.",
            "Review feedback with the opticians.",
          )
        : t(
            "Acompanhar o serviço na próxima revisão.",
            "Monitor service at the next review.",
          );
  const rows = [
    [
      t("Perda de margem por ocorrência", "Margin lost to incidents"),
      t(
        `${number(crossings)} de ${number(totals.delivered)} entregas (${pct(crossings / (totals.delivered || 1))})`,
        `${number(crossings)} of ${number(totals.delivered)} deliveries (${pct(crossings / (totals.delivered || 1))})`,
      ),
      crossings
        ? t(
            "Consultar abaixo as encomendas que passaram de contribuição positiva ou nula a negativa.",
            "Inspect the orders below that crossed from non-negative to negative contribution.",
          )
        : t(
            "Nenhuma entrega mudou de sinal após a ocorrência.",
            "No delivery crossed below zero after incident costs.",
          ),
    ],
    [
      t("Margem antes das ocorrências", "Margin before incidents"),
      totals.sales ? pct(marginBefore) : "—",
      lowMargin
        ? expensive
          ? t(
              "Produção acima do catálogo. Confirmar a unidade de custeio e rever os modelos mais caros.",
              "Production exceeds catalogue cost. Confirm the costing unit and review expensive models.",
            )
          : t(
              "Margem abaixo de 10%. Comparar preço praticado, produção e transporte.",
              "Margin below 10%. Compare selling prices, production and shipping.",
            )
        : t(
            "Comparar o efeito dos custos de produção e do valor de venda no cenário.",
            "Compare the effects of production cost and selling price in the scenario.",
          ),
    ],
    [
      t("Satisfação das óticas", "Optician satisfaction"),
      count
        ? t(
            `${number(score, 2)}/5 em ${count} respostas`,
            `${number(score, 2)}/5 from ${count} responses`,
          )
        : "—",
      count < 10
        ? t(
            "Recolher mais avaliações para atingir o mínimo de 10 respostas.",
            "Gather more feedback to reach the minimum of 10 responses.",
          )
        : score < 4 && top
          ? t(
              `Rever o tema «${labels[top[0]] ?? top[0]}» com a ótica. Surge em ${top[1]} avaliações abaixo de 4/5.`,
              `Review ${labels[top[0]] ?? top[0]} with the optician. It appears in ${top[1]} ratings below 4/5.`,
            )
          : t(
              "Acompanhar a satisfação no próximo período.",
              "Monitor satisfaction next period.",
            ),
    ],
  ];
  return (
    <>
      <h2>{t("Onde atuar primeiro?", "Where to act first?")}</h2>
      <p className="my-4 border-s-4 border-chart bg-surface-soft px-4 py-3 font-semibold">{priority}</p>
      <div className="max-h-84 overflow-auto">
        <table>
          <thead>
            <tr>
              {[
                t("Indicador", "Indicator"),
                t("Histórico", "Historical value"),
                t("Atuação sugerida", "Suggested action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, v, a]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{v}</td>
                <td>{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>
          {t(
            "Critérios e cobertura do serviço",
            "Service coverage and decision criteria",
          )}
        </summary>
        <p>
          {t(
            "O diagnóstico sinaliza margem anterior às ocorrências inferior a 10% e satisfação abaixo de 4/5 com pelo menos 10 respostas. Por modelo, contamos avaliações ligadas a uma entrega da mesma ótica desde a data de entrega. Para todos os modelos, contamos todo o feedback da seleção.",
            "The diagnostic flags pre-incident margin below 10% and satisfaction below 4/5 with at least 10 responses. Per model, we count ratings linked to a delivery by the same optician on or after delivery. All models includes all feedback in scope.",
          )}
        </p>
        <p>
          {t(
            `Há ${totals.pendingAdjustments} ajustes registados como «em análise». Confirmar o desfecho com o pós-venda. Falta a data de fecho para medir o tempo de resolução.`,
            `${totals.pendingAdjustments} adjustments are recorded as under review. Confirm outcomes with after-sales support. A closure date is needed to measure turnaround.`,
          )}
        </p>
      </details>
    </>
  );
}
