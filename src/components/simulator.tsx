import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
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
}: {
  data: Network;
  scenario: Scenario & {
    change: (v: Partial<Scenario>) => void;
    reset: () => void;
  };
  result: ReturnType<typeof simulate>;
}) {
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
            <SlidersHorizontal size={16} /> Simulador
          </p>
          <h2>Testar uma decisão</h2>
        </div>
        <button type="button" onClick={s.reset}>
          <RotateCcw size={15} /> Repor cenário
        </button>
      </div>
      <div className="simgrid">
        <div>
          <div className="filters">
            <label>
              Ótica
              <select
                value={s.shop}
                onChange={(e) => s.change({ shop: e.target.value })}
              >
                <option value="all">Toda a rede</option>
                {data.shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.cidade}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modelo
              <select
                value={s.lens}
                onChange={(e) => s.change({ lens: e.target.value })}
              >
                <option value="priority">Progressivas L001–L012</option>
                <option value="all">Todos os modelos</option>
                {data.lenses.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} · {l.categoria}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Slider
            label="Redução do custo das ocorrências"
            min={0}
            max={50}
            value={s.reduction}
            onChange={(reduction) => s.change({ reduction })}
          />
          <Slider
            label="Variação do custo de produção"
            min={-25}
            max={25}
            value={s.productionChange}
            onChange={(productionChange) => s.change({ productionChange })}
          />
          <Slider
            label="Variação do valor de venda"
            min={-20}
            max={20}
            value={s.priceChange}
            onChange={(priceChange) => s.change({ priceChange })}
          />
          <label className="unit">
            Custo de produção aplicado
            <select
              value={s.unit ? "lens" : "order"}
              onChange={(e) => s.change({ unit: e.target.value === "lens" })}
            >
              <option value="order">Por encomenda</option>
              <option value="lens">Por lente</option>
            </select>
          </label>
        </div>
        <div className="result" aria-live="polite">
          <p className="label">Variação da contribuição</p>
          <strong>
            {result.delta > 0 ? "+" : ""}
            {money(result.delta)}
          </strong>
          <p>{number(result.t.delivered)} encomendas entregues no cenário</p>
          <dl>
            <dt>Contribuição histórica</dt>
            <dd>{money(result.base)}</dd>
            <dt>Contribuição simulada</dt>
            <dd>{money(result.projected)}</dd>
            <dt>Custo histórico das ocorrências</dt>
            <dd>{money(result.t.deliveredIncidentCost)}</dd>
          </dl>
          <small>
            Simulação a volume constante, em unidades monetárias da fonte. A
            unidade do custo de produção está por confirmar.
          </small>
        </div>
      </div>
      <details>
        <summary>Consultar a contribuição de uma encomenda entregue</summary>
        <label>
          Referência ou ID da encomenda
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex. E000017 ou 2024/000017"
          />
        </label>
        {order ? (
          <p>
            {order.recordId} · {order.code} · {order.quantity} lentes. Valor{" "}
            {money(order.sales)}, produção{" "}
            {money(order.production * (s.unit ? order.quantity : 1))}, logística{" "}
            {money(order.shipping)} e ocorrências {money(order.incident)}.
            Contribuição estimada{" "}
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
            Sem encomenda entregue com esse código. Introduz o código completo.
          </p>
        )}
      </details>
    </section>
  );
}
