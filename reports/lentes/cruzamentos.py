"""Executar com python reports/lentes/cruzamentos.py. Requer pandas e NumPy."""

import numpy as np
import pandas as pd

from anomalias import KEY, LENS, load, read


def capacity(orders, year):
    start = orders.data_inicio.dt.to_period("M")
    end = orders.data_fim.dt.to_period("M")
    # Só trabalho entregue que começou e terminou dentro do mês em análise.
    g = orders[start.eq(end) & start.dt.year.eq(year) & orders.estado.eq("entregue")].copy()
    g["month"] = start[g.index]
    table = g.groupby(["month", "operador"]).horas.sum().unstack(fill_value=0)
    slots = table.div(table.index.days_in_month, axis=0)
    print(year, "operador-meses acima de 24 h/dia:", int(slots.gt(24).sum().sum()),
          "/", slots.size, "meses em que os 10 excedem:", int(slots.gt(24).all(axis=1).sum()))
    peak = slots.stack().idxmax()
    print("Máximo:", peak, round(table.loc[peak], 2), round(slots.loc[peak], 2),
          "h/dia. Novembro/dezembro:", slots.iloc[-2:].min().round(1).min(),
          "a", round(slots.iloc[-2:].max().max(), 1))


def week_weights(frame):
    # A primeira linha mantém a amostra observada. Cada réplica reamostra semanas inteiras.
    n = frame.week.nunique()
    rng = np.random.default_rng(42)
    return np.vstack([np.ones(n), rng.multinomial(n, np.full(n, 1/n), size=5000)])


def show(label, values):
    lo, hi = np.quantile(values[1:], [.005, .995])
    print(f"{label}: {values[0]:.4f} (IC 99% {lo:.4f} a {hi:.4f})")


def correlations(g):
    # Momentos suficientes para recalcular as médias de cada modelo em cada réplica.
    g = g.assign(x=g.horas, y=g.custo_real, xx=g.horas**2,
                 yy=g.custo_real**2, xy=g.horas*g.custo_real, n=1)
    cells = g.groupby(["week", LENS])[["n", "x", "y", "xx", "yy", "xy"]].sum()
    weights = week_weights(g)
    n, x, y, xx, yy, xy = [weights @ cells[c].unstack(fill_value=0).to_numpy()
                             for c in cells]
    cross = (xy - x*y/n).sum(axis=1)
    within = cross / np.sqrt((xx - x*x/n).sum(axis=1) * (yy - y*y/n).sum(axis=1))
    n, x, y, xx, yy, xy = [v.sum(axis=1) for v in [n, x, y, xx, yy, xy]]
    total_cross = xy - x*y/n
    pooled = total_cross / np.sqrt((xx - x*x/n) * (yy - y*y/n))
    show("Correlação horas/custo global", pooled)
    show("Correlação horas/custo dentro do modelo", within)
    show("Queda na correlação", pooled - within)
    # Verificação direta dos dois coeficientes observados.
    resid = g[["x", "y"]] - g.groupby(LENS)[["x", "y"]].transform("mean")
    assert np.isclose(within[0], resid.x.corr(resid.y))
    assert np.isclose(pooled[0], g.x.corr(g.y))


def compare_tails(g, field, cuts):
    lo, hi = cuts
    samples = [g[g[field].le(lo)], g[g[field].ge(hi)]]
    weeks = sorted(g.week.unique())
    weights = week_weights(g)
    rates = []
    for sample in samples:
        by_week = sample.groupby("week").late.agg(["sum", "size"]).reindex(weeks, fill_value=0)
        rates.append(100*(weights @ by_week["sum"]) / (weights @ by_week["size"]))
        print(field, len(sample), "entregas;", int(sample.late.sum()), "atrasos;",
              "medianas:", sample[[field, "custo"]].median().round(2).to_dict())
    show("Diferença de atrasos, alto menos baixo, pontos percentuais", rates[1]-rates[0])


def main():
    orders, _, _ = load()
    for name, cols in [("producao", ["operador", "data_inicio", "data_fim"]),
                       ("custos_logistica", ["distancia_km"])]:
        orders = orders.merge(read(name)[[KEY, *cols]], on=KEY, validate="one_to_one")
    for col in ["data_inicio", "data_fim", "data_entrega_prevista"]:
        orders[col] = pd.to_datetime(orders[col], format="%Y-%m-%d")
    orders["week"] = orders.data_encomenda.dt.to_period("W-SUN")
    orders["volume"] = orders.groupby("data_encomenda")[KEY].transform("size")
    orders["late"] = (orders.data_entrega_real - orders.data_entrega_prevista).dt.days.ge(2)
    training = orders[orders.ano.eq(2024)]
    # Quartis para dias (cada dia com peso igual) e distâncias de entregas.
    load_cuts = training.drop_duplicates("data_encomenda").volume.quantile([.25, .75]).to_numpy()
    dist_cuts = training.loc[training.estado.eq("entregue"), "distancia_km"].quantile([.25, .75]).to_numpy()
    print("Cortes de 2024 (volume diário, km):", load_cuts, dist_cuts)
    for year in [2024, 2025]:
        capacity(orders, year)
        delivered = orders[orders.ano.eq(year) & orders.estado.eq("entregue")]
        single = delivered[delivered.quantidade.eq(1)]
        print("Entregas de uma lente:", len(single))
        correlations(single)
        for field, cuts in [("volume", load_cuts), ("distancia_km", dist_cuts)]:
            compare_tails(delivered, field, cuts)
        promised = (delivered.data_entrega_prevista - delivered.data_encomenda).dt.days
        print("Prazo prometido igual à duração de catálogo + 2 dias:",
              int(promised.eq(delivered.duracao_producao_dias + 2).sum()), "/", len(delivered))
        # Interação na escala de risco: o efeito da distância muda nos dias de pico?
        weights = week_weights(delivered)
        weeks = sorted(delivered.week.unique())
        distance_gaps = []
        for traffic in [delivered.volume.le(load_cuts[0]), delivered.volume.ge(load_cuts[1])]:
            rates = []
            for distance in [delivered.distancia_km.le(dist_cuts[0]), delivered.distancia_km.ge(dist_cuts[1])]:
                tail = delivered[traffic & distance]
                weekly = tail.groupby("week").late.agg(["sum", "size"]).reindex(weeks, fill_value=0)
                rates.append(100*(weights @ weekly["sum"]) / (weights @ weekly["size"]))
            distance_gaps.append(rates[1] - rates[0])
        show("Interação volume e distância, pontos percentuais", distance_gaps[1] - distance_gaps[0])


if __name__ == "__main__":
    main()
