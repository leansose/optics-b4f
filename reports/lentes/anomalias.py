"""Executar com python reports/lentes/anomalias.py (pandas e numpy)."""

from math import comb, lgamma
from pathlib import Path

import numpy as np
import pandas as pd


SOURCE = Path(__file__).resolve().parents[2] / "public/data/lentes/csv"
KEY = "id_encomenda"
SHOP = "id_otica"
LENS = "id_lente"


def read(name):
    return pd.read_csv(SOURCE / f"{name}.csv", sep=";", decimal=",")


def load():
    raw = read("encomendas_lentes")
    orders = raw.drop_duplicates().copy()
    assert orders[KEY].is_unique and orders[KEY].notna().all()
    print(f"Encomendas: {len(raw)} linhas, {len(orders)} únicas.")
    for col in ["data_encomenda", "data_entrega_real"]:
        dates = orders[col].astype("string")
        iso = pd.to_datetime(dates.where(~dates.str.contains("/", na=False)), format="%Y-%m-%d")
        orders[col] = iso.fillna(pd.to_datetime(dates.where(dates.str.contains("/", na=False)), format="%d/%m/%Y"))
    assert orders.data_encomenda.notna().all()
    assert orders.data_entrega_real.notna().equals(orders.estado.eq("entregue"))
    orders["ano"] = orders.data_encomenda.dt.year
    orders["mes"] = orders.data_encomenda.dt.month
    for name, cols in [("producao", ["custo_real", "horas"]), ("custos_logistica", ["custo"])]:
        detail = read(name)
        assert set(detail[KEY]) == set(orders[KEY])
        orders = orders.merge(detail[[KEY, *cols]], on=KEY, validate="one_to_one")
    catalog = read("lentes_catalogo").rename(columns={"id": LENS})
    orders = orders.merge(catalog, on=LENS, how="left", validate="many_to_one")
    assert orders[["preco_base", "custo_base_estimado", "quantidade"]].gt(0).all().all()
    events = read("retrabalho_devolucoes")
    assert events.id.is_unique
    linked = events[events[KEY].isin(orders[KEY])].copy()
    print(f"Ocorrências: {len(linked)} associadas, {len(events)-len(linked)} sem encomenda.")
    orders["afetada"] = orders[KEY].isin(linked[KEY])
    orders["preco_relativo"] = orders.valor_total / (orders.quantidade * orders.preco_base)
    orders["custo_relativo"] = orders.custo_real / orders.custo_base_estimado
    orders["saldo"] = orders.valor_total - orders.custo_real - orders.custo
    events = linked.rename(columns={"id": "id_ocorrencia"}).merge(
        orders, on=[KEY, SHOP, LENS], validate="many_to_one")
    assert len(events) == len(linked)
    events["data_registo"] = pd.to_datetime(events.data_registo, format="%Y-%m-%d")
    feedback = read("feedback_oticas")
    assert feedback.id.is_unique
    feedback["ano"] = pd.to_datetime(feedback.data).dt.year
    feedback["mes"] = pd.to_datetime(feedback.data).dt.month
    return orders, events, feedback


def hypergeom(n, successes, draws):
    # Distribuição do número de sucessos por permutação dentro do estrato.
    def logchoose(a, b):
        return lgamma(a + 1) - lgamma(b + 1) - lgamma(a - b + 1)

    lower = max(0, draws - (n - successes))
    upper = min(draws, successes)
    logs = np.array([logchoose(successes, k) + logchoose(n - successes, draws - k)
                     for k in range(lower, upper + 1)])
    weights = np.exp(logs - logs.max())
    return lower, weights / weights.sum()


def conditional_p(frame, strata):
    # Soma de hipergeométricas independentes, condicionada às margens de cada estrato.
    dist = np.array([1.0])
    offset = 0
    for _, g in frame.groupby(strata):
        lo, pmf = hypergeom(len(g), int(g.event.sum()), int(g.group.sum()))
        offset += lo
        dist = np.convolve(dist, pmf)
    observed = int((frame.group & frame.event).sum()) - offset
    return min(1.0, 2 * min(dist[:observed + 1].sum(), dist[observed:].sum()))


def sign_p(wins, losses):
    n = wins + losses
    return min(1.0, 2 * sum(comb(n, k) for k in range(min(wins, losses) + 1)) / 2**n)


def signed_months(diffs):
    return int((diffs > 0).sum()), int((diffs < 0).sum())


def compare(title, frame, group, event, strata):
    out = frame.assign(group=group, event=event)
    print(f"\n{title}")
    for year, g in out.groupby("ano", sort=True):
        counts = g.groupby("group").event.agg(["sum", "size"])
        rates = counts["sum"] / counts["size"]
        print(year, counts.to_dict("index"), f"diferença={rates[True]-rates[False]:.5f}")
    valid = out[out.ano.eq(2025)]
    table = valid.groupby(["mes", "group"]).event.mean().unstack()
    wins, losses = signed_months(table[True] - table[False])
    print(f"Meses +/-: {wins}/{losses}, p mensal={sign_p(wins, losses):.5g}")
    if SHOP in strata:
        gaps = []
        for shop in valid[SHOP].unique():
            rates = valid[valid[SHOP].ne(shop)].groupby("group").event.mean()
            gaps.append(rates[True] - rates[False])
        print(f"Diferença omitindo uma ótica de cada vez: {min(gaps):.5f} a {max(gaps):.5f}")
    return conditional_p(valid, strata)


def best_window(series, width):
    # Em caso de empate, escolher o intervalo mais cedo.
    return max(range(int(series.min()) - width + 1, int(series.max()) + 1),
               key=lambda k: series.between(k, k + width - 1).sum())


def clocks(events):
    ret = events[events.tipo_ocorrencia.eq("devolucao") & events.data_entrega_real.notna()]
    ret = ret.sort_values(["data_registo", "id_ocorrencia"]).drop_duplicates(KEY).copy()
    for label, origin in [("pedido", "data_encomenda"), ("entrega", "data_entrega_real")]:
        ret[label] = (ret.data_registo - ret[origin]).dt.days
    train = ret[ret.ano.eq(2024)]
    width = int(train.pedido.max() - train.pedido.min() + 1)
    for col in ["pedido", "entrega"]:
        start = best_window(train[col], width)
        ret["ok_" + col] = ret[col].between(start, start + width - 1)
        print(f"Janela {col}: [{start}, {start + width - 1}]")
    for year, g in ret.groupby("ano"):
        print(year, len(g), "cobertos (pedido, entrega)", g.ok_pedido.sum(), g.ok_entrega.sum(),
              "anteriores à entrega", g.entrega.lt(0).sum())
    g = ret[ret.ano.eq(2025)]
    differences = g.ok_pedido.astype(int) - g.ok_entrega.astype(int)
    print("Meses +/-:", signed_months(differences.groupby(g.mes).sum()))
    return sign_p(*signed_months(differences))  # McNemar exato sobre pares discordantes


def main():
    orders, events, fb = load()
    train = orders[orders.ano.eq(2024)]
    values = np.sort(train.preco_relativo.unique())
    i = np.diff(values).argmax()
    threshold = values[i:i + 2].mean()
    print(f"Maior lacuna de preço relativo em 2024: {values[i:i+2]}, corte {threshold:.6f}")
    ordinary = orders[orders.quantidade.eq(1) & orders.estado.eq("entregue") &
                      ~orders.afetada & orders.preco_relativo.gt(threshold)]
    peers = ordinary[ordinary.complexidade.eq(4) & ordinary.categoria.eq("progressiva")]
    training_peers = peers[peers.ano.eq(2024)]
    worst = training_peers.saldo.lt(0).groupby(training_peers[LENS]).mean().idxmax()
    ps = [compare(f"Perda em condições habituais: {worst}", peers, peers[LENS].eq(worst),
                  peers.saldo.lt(0), [SHOP, "mes"])]
    model = peers[peers[LENS].eq(worst) & peers.ano.eq(2025)]
    print("Medianas L004:", model[["valor_total", "custo_real", "custo", "saldo"]].median().to_dict())
    print("L004 passa de saldo não negativo a negativo com logística:",
          (model.valor_total.ge(model.custo_real) & model.saldo.lt(0)).sum())

    c4 = orders[orders.complexidade.eq(4)]
    best = c4[c4.ano.eq(2024)].groupby(LENS).afetada.mean().idxmin()
    ps.append(compare(f"Ocorrências na complexidade 4: {best}", c4, c4[LENS].eq(best),
                      c4.afetada, [SHOP, "mes"]))
    single = c4[c4.ano.eq(2025) & c4.quantidade.eq(1)]
    print("Medianas por grupo:", single.groupby(single[LENS].eq(best))[["custo_relativo", "horas"]].median().to_dict())

    repair = events[events.tipo_ocorrencia.eq("retrabalho") & events.quantidade.eq(1) &
                    events.estado.eq("entregue") & events.preco_relativo.gt(threshold) &
                    events.categoria.ne("progressiva")].copy()
    # Uma exposição por encomenda. Usar o primeiro retrabalho, sem selecionar pelo custo.
    repair = repair.sort_values(["data_registo", "id_ocorrencia"]).drop_duplicates(KEY)
    exceeds = repair.custo_estimado.gt(repair.valor_total)
    tr = repair.ano.eq(2024)
    category = exceeds[tr].groupby(repair.loc[tr, "categoria"]).mean().idxmax()
    ps.append(compare(f"Retrabalho excede valor integral: {category}", repair,
                      repair.categoria.eq(category), exceeds, [SHOP]))
    g = repair[repair.ano.eq(2025)]
    print("Medianas no retrabalho:", g.groupby(g.categoria.eq(category))[["valor_total", "custo_estimado"]].median().to_dict())

    floors = fb[fb.ano.eq(2024)].groupby(SHOP).satisfacao_geral.min()
    shops = floors[floors.ge(4)].index
    complaints = fb[fb.comentario.eq("houve atraso")].sort_values(["data", "id"])
    complaints = complaints[complaints[KEY].isna() | ~complaints.duplicated(["ano", KEY])]
    ps.append(compare(f"Nota de 4–5 com comentário 'houve atraso': {list(shops)}", complaints,
                      complaints[SHOP].isin(shops), complaints.satisfacao_geral.ge(4), ["mes", "resolvido"]))
    validation = fb[fb.ano.eq(2025)]
    print("Distribuição das notas em todas as respostas de 2025:")
    print(pd.crosstab(validation[SHOP], validation.satisfacao_geral))
    print("\nRelógio da primeira devolução")
    ps.append(clocks(events))
    # Holm controla a probabilidade de pelo menos um falso positivo na família.
    ranking = np.argsort(ps)
    adjusted = np.empty(len(ps))
    adjusted[ranking] = np.minimum(1, np.maximum.accumulate(np.array(ps)[ranking] * np.arange(len(ps), 0, -1)))
    for name, raw, corrected in zip(["L004", "L040", "retrabalho", "feedback", "relógio"], ps, adjusted):
        print(f"{name}: p={raw:.5g}, p Holm={corrected:.5g}")


if __name__ == "__main__":
    main()
