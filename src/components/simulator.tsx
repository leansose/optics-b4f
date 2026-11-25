import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Language } from "@/hooks/use-preferences";
import { money, number, type simulate } from "@/lib/analytics";
import type { Network, Scenario } from "@/types";

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
  return (
    <label className="slider">
      <span>
        {label}
        <b>
          {value > 0 ? "+" : ""}
          {value}%
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
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
  const [query, setQuery] = useState("");
  const term = query.trim().toUpperCase();
  const order = term
    ? data.orderDetails.find(
        (item) =>
          item.code.toUpperCase() === term ||
          item.recordId?.toUpperCase() === term,
      )
    : data.example;
  return (
    <section id="simulador" className="panel">
      <div className="sectionhead">
        <div>
          <p className="label">
            <SlidersHorizontal size={16} /> {t("Simulador", "Simulator")}
          </p>
          <h2>{t("Testar uma decisão", "Test a decision")}</h2>
        </div>
        <button type="button" onClick={s.reset}>
          <RotateCcw size={15} /> {t("Repor cenário", "Reset scenario")}
        </button>
      </div>
      <div className="simgrid">
        <div>
          <div className="filters">
            <label>
              {t("Ótica", "Optician")}
              <select
                value={s.shop}
                onChange={(e) => s.change({ shop: e.target.value })}
              >
                <option value="all">
                  {t("Toda a rede", "Entire network")}
                </option>
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
                <option value="all">
                  {t("Todos os modelos", "All models")}
                </option>
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
          </div>
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
          <label className="unit">
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
        <div className="result" aria-live="polite">
          <p className="label">
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
          <dl>
            <dt>{t("Contribuição histórica", "Historical contribution")}</dt>
            <dd>{money(result.base)}</dd>
            <dt>{t("Contribuição simulada", "Simulated contribution")}</dt>
            <dd>{money(result.projected)}</dd>
            <dt>
              {t("Custo histórico das ocorrências", "Historical incident cost")}
            </dt>
            <dd>{money(result.t.deliveredIncidentCost)}</dd>
          </dl>
          <small>
            {t(
              "Simulação a volume constante, em unidades monetárias da fonte. A unidade do custo de produção está por confirmar.",
              "Simulation at constant volume, in the source monetary units. The production cost unit remains to be confirmed.",
            )}
          </small>
        </div>
      </div>
      <details>
        <summary>
          {t(
            "Consultar a contribuição de uma encomenda entregue",
            "View contribution for a delivered order",
          )}
        </summary>
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
        {order ? (
          <p>
            {order.recordId} · {order.code} · {order.quantity}{" "}
            {t("lentes. Valor", "lenses. Value")} {money(order.sales)},{" "}
            {t("produção", "production")}{" "}
            {money(order.production * (s.unit ? order.quantity : 1))},{" "}
            {t("logística", "shipping")} {money(order.shipping)}{" "}
            {t("e ocorrências", "and incidents")} {money(order.incident)}.
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
  );
}
