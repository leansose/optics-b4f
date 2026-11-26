"""Builds src/data/metrics.json from public/data/lentes/csv.
Run from the project root:  python3 scripts/build-metrics.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "public" / "data" / "lentes" / "csv"
OUT = ROOT / "src" / "data" / "metrics.json"


def rd(name):
    return pd.read_csv(CSV / name, sep=";", decimal=",", encoding="utf-8-sig", dtype=str)


def num(s):
    return pd.to_numeric(s.str.replace(",", "."), errors="coerce")


raw = rd("encomendas_lentes.csv")
raw_rows = len(raw)
dup_mask = raw.duplicated()
dup_rows = int(dup_mask.sum())
dup_value = float(num(raw.loc[dup_mask, "valor_total"]).sum())
enc = raw.drop_duplicates().copy()

# dates: ISO or dd/mm/yyyy
d = pd.to_datetime(enc["data_encomenda"], format="%Y-%m-%d", errors="coerce")
d2 = pd.to_datetime(enc["data_encomenda"], format="%d/%m/%Y", errors="coerce")
enc["dt"] = d.fillna(d2)
enc["prev"] = pd.to_datetime(enc["data_entrega_prevista"], errors="coerce")
enc["real"] = pd.to_datetime(enc["data_entrega_real"], errors="coerce")
enc["qty"] = num(enc["quantidade"])
enc["valor"] = num(enc["valor_total"])

prod = rd("producao.csv")
prod["custo_prod"] = num(prod["custo_real"])
log = rd("custos_logistica.csv")
log["custo_log"] = num(log["custo"])
occ = rd("retrabalho_devolucoes.csv")
occ["custo"] = num(occ["custo_estimado"])
occ["qa"] = num(occ["quantidade_afetada"])
cat = rd("lentes_catalogo.csv")
cat["preco"] = num(cat["preco_base"])
cat["custo_base"] = num(cat["custo_base_estimado"])
cat["compl"] = num(cat["complexidade"])
ot = rd("oticas_parceiras.csv")
fb = rd("feedback_oticas.csv")

enc = enc.merge(prod[["id_encomenda", "custo_prod", "data_fim"]], on="id_encomenda", how="left")
enc = enc.merge(log[["id_encomenda", "custo_log"]], on="id_encomenda", how="left")
enc = enc.merge(cat[["id", "preco", "custo_base", "compl"]], left_on="id_lente", right_on="id", how="left", suffixes=("", "_l"))

valid_ids = set(enc["id_encomenda"])
occ["linked"] = occ["id_encomenda"].isin(valid_ids)
occ_l = occ[occ["linked"]]
occ_sum = occ_l.groupby("id_encomenda")["custo"].sum()
enc["custo_occ"] = enc["id_encomenda"].map(occ_sum).fillna(0.0)
enc["affected"] = enc["id_encomenda"].isin(set(occ_l["id_encomenda"]))
enc["grp"] = np.where(enc["id_lente"].str[1:].astype(int) <= 12, "A", "O")
enc["num_lente"] = enc["id_lente"].str[1:].astype(int)

dl = enc[enc["estado"] == "entregue"].copy()
dl["c_order"] = dl["valor"] - dl["custo_prod"] - dl["custo_log"] - dl["custo_occ"]
dl["c_lens"] = dl["valor"] - dl["custo_prod"] * dl["qty"] - dl["custo_log"] - dl["custo_occ"]

N = len(enc)
tot_aff = int(enc["affected"].sum())

def grp_stats(mask):
    g = enc[mask]
    gd = dl[mask.loc[dl.index]]
    orders = len(g)
    aff = int(g["affected"].sum())
    cost = float(occ_l[occ_l["id_encomenda"].isin(set(g["id_encomenda"]))]["custo"].sum())
    return dict(orders=orders, affected=aff, rate=aff / orders, cost=cost,
                avgContribution=float(gd["c_order"].mean()))

m_a = enc["num_lente"] <= 12
m_b = (enc["num_lente"] >= 13) & (enc["num_lente"] <= 20)
m_c = enc["num_lente"] > 20
groups = {"L001-L012": grp_stats(m_a), "L013-L020": grp_stats(m_b), "others": grp_stats(m_c)}
rate_a = groups["L001-L012"]["rate"]
rate_rest = (groups["L013-L020"]["affected"] + groups["others"]["affected"]) / (groups["L013-L020"]["orders"] + groups["others"]["orders"])
cost_total_linked = float(occ_l["custo"].sum())

# single-lens production deviation
def dev(mask):
    s = enc[mask & (enc["qty"] == 1)]
    return float(s["custo_prod"].sum() / s["custo_base"].sum() - 1)
groups["L001-L012"]["prodDeviation"] = dev(m_a)
groups["L013-L020"]["prodDeviation"] = dev(m_b)
groups["others"]["prodDeviation"] = dev(m_c)

# L001
l1 = enc[enc["id_lente"] == "L001"]
l001 = dict(orders=len(l1), affected=int(l1["affected"].sum()),
            cost=float(occ_l[occ_l["id_lente"] == "L001"]["custo"].sum()))

# opticians
share_net = enc.groupby("id_lente").size() / N
rows = []
for _, o in ot.iterrows():
    g = enc[enc["id_otica"] == o["id"]]
    gd = dl[dl["id_otica"] == o["id"]]
    rate_by_model = g.groupby("id_lente")["affected"].mean()
    adj = float((rate_by_model.reindex(share_net.index).fillna(0) * share_net).sum())
    rows.append(dict(id=o["id"], name=o["cidade"], orders=len(g),
                     shareA=float((g["num_lente"] <= 12).mean()),
                     affected=int(g["affected"].sum()),
                     observed=float(g["affected"].mean()), adjusted=adj,
                     contribution=float(gd["c_order"].sum())))
rows.sort(key=lambda r: -r["orders"])

# monthly
enc["ym"] = enc["dt"].dt.to_period("M")
mon = enc.groupby("ym").size()
monthly = {str(y): [int(mon.get(pd.Period(f"{y}-{m:02d}"), 0)) for m in range(1, 13)] for y in (2024, 2025)}
def perday(year, months):
    days = sum(pd.Period(f"{year}-{m:02d}").days_in_month for m in months)
    return sum(monthly[str(year)][m - 1] for m in months) / days

# delays
delay = (dl["real"] - dl["prev"]).dt.days
buckets = dict(onTime=int((delay == 0).sum()), oneDay=int((delay == 1).sum()), twoPlus=int((delay >= 2).sum()))
late_days = int(delay[delay > 0].sum())
two_days = int(delay[delay >= 2].sum())

# price tiers
dl["ratio"] = dl["valor"] / dl["qty"] / dl["preco"]
low = dl[dl["ratio"] < 0.8]
high = dl[dl["ratio"] >= 0.8]

# example order
ex = dl[dl["id_encomenda"] == "2024/000017"].iloc[0]
example = dict(code="2024/000017", store="Lisboa", model="L011", qty=int(ex["qty"]),
               value=float(ex["valor"]), production=float(ex["custo_prod"]),
               logistics=float(ex["custo_log"]), incident=float(ex["custo_occ"]),
               contribOrder=float(ex["c_order"]), contribLens=float(ex["c_lens"]))

# data quality
unlinked = occ[~occ["linked"]]
occ_m = occ_l.merge(enc[["id_encomenda", "qty", "real", "estado"]], on="id_encomenda")
qty_excess = int((occ_m["qa"] > occ_m["qty"]).sum())
occ_m["dr"] = pd.to_datetime(occ_m["data_registo"], errors="coerce")
ret = occ_m[(occ_m["tipo_ocorrencia"] == "devolucao") & (occ_m["estado"] == "entregue")]
ret_before = int((ret["dr"] < ret["real"]).sum())
fb["dt"] = pd.to_datetime(fb["data"], errors="coerce")
fb_merge = fb.merge(enc[["id_encomenda", "dt"]], on="id_encomenda", how="left", suffixes=("", "_o"))
fb_noorder = int((~fb["id_encomenda"].isin(valid_ids)).sum())
fb_before = int(((fb_merge["dt"] < fb_merge["dt_o"]) & fb_merge["dt_o"].notna()).sum())
code_formats = {
    "ENC000001": int(enc["id_encomenda"].str.match(r"^ENC\d{6}$").sum()),
    "2024/000002": int(enc["id_encomenda"].str.match(r"^\d{4}/\d{6}$").sum()),
    "ENC-2024-000003": int(enc["id_encomenda"].str.match(r"^ENC-\d{4}-\d{6}$").sum()),
}

metrics = dict(
    period="Jan 2024 – Dec 2025",
    network=dict(orders=N, delivered=len(dl), affected=tot_aff, affectedRate=tot_aff / N,
                 incidentCostLinked=cost_total_linked, shareA=float(m_a.mean()),
                 costShareA=groups["L001-L012"]["cost"] / cost_total_linked),
    quality=dict(groups=groups, ratio=rate_a / rate_rest, rateA=rate_a, rateRest=rate_rest, l001=l001,
                 opticians=rows,
                 coimbra=next(r for r in rows if r["name"] == "Coimbra")),
    finance=dict(
        delivered=len(dl),
        orderValue=float(dl["valor"].sum()), production=float(dl["custo_prod"].sum()),
        productionPerLens=float((dl["custo_prod"] * dl["qty"]).sum()),
        logistics=float(dl["custo_log"].sum()), incidents=float(dl["custo_occ"].sum()),
        contribOrder=float(dl["c_order"].sum()), contribLens=float(dl["c_lens"].sum()),
        negOrder=int((dl["c_order"] < 0).sum()), negLens=int((dl["c_lens"] < 0).sum()),
        lowPrice=dict(n=len(low), neg=int((low["c_order"] < 0).sum()),
                      highN=len(high), highNeg=int((high["c_order"] < 0).sum())),
        example=example),
    logistics=dict(
        deliveredTotal=len(dl), buckets=buckets,
        twoPlusShare=buckets["twoPlus"] / len(dl), twoPlusDelayDaysShare=two_days / late_days,
        monthly=monthly,
        perDayNovDec=dict(y2024=perday(2024, [11, 12]), y2025=perday(2025, [11, 12])),
        perDayJulAug=dict(y2024=perday(2024, [7, 8]), y2025=perday(2025, [7, 8])),
        novDecOrders=dict(y2024=sum(monthly["2024"][10:]), y2025=sum(monthly["2025"][10:]))),
    dataQuality=dict(
        rawRows=raw_rows, duplicates=dup_rows, duplicateValue=dup_value,
        unlinkedIncidents=len(unlinked), unlinkedCost=float(unlinked["custo"].sum()),
        totalIncidents=len(occ), codeFormats=code_formats,
        qtyExceeds=qty_excess, returnsBeforeDelivery=ret_before, returnsDelivered=len(ret),
        missingMotive=int(occ["motivo"].isna().sum()), missingResolution=int(occ["resolucao"].isna().sum()),
        feedbackTotal=len(fb), feedbackNoOrder=fb_noorder, feedbackBeforeOrder=fb_before),
)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
print(json.dumps(metrics, indent=1, ensure_ascii=False)[:6000])


# ======================================================================
# Cube for the interactive dashboard -> src/data/cube.json
# ======================================================================
def pdate(s):
    a = pd.to_datetime(s, format="%Y-%m-%d", errors="coerce")
    b = pd.to_datetime(s, format="%d/%m/%Y", errors="coerce")
    return a.fillna(b)


shops = list(ot["id"])
shop_idx = {s: i for i, s in enumerate(shops)}
enc["shop"] = enc["id_otica"].map(shop_idx)
enc["year"] = enc["dt"].dt.year
enc["month"] = enc["dt"].dt.month
enc["gidx"] = np.where(enc["num_lente"] <= 12, 0, np.where(enc["num_lente"] <= 20, 1, 2))
enc["is_del"] = enc["estado"] == "entregue"
enc["c_order"] = enc["valor"] - enc["custo_prod"] - enc["custo_log"] - enc["custo_occ"]
enc["c_lens"] = enc["valor"] - enc["custo_prod"] * enc["qty"] - enc["custo_log"] - enc["custo_occ"]
enc["delay"] = (enc["real"] - enc["prev"]).dt.days
enc["low"] = enc["is_del"] & ((enc["valor"] / enc["qty"] / enc["preco"]) < 0.8)

MEASURES = ["o", "a", "ic", "d", "v", "p", "pl", "lg", "oc", "nO", "nL", "t0", "t1", "t2",
            "dd", "d2", "lowN", "lowNegO", "lowNegL", "sp", "sb"]


def cell(g):
    d = g[g["is_del"]]
    s1 = g[g["qty"] == 1]
    vals = dict(
        o=len(g), a=int(g["affected"].sum()), ic=round(float(g["custo_occ"].sum()), 2),
        d=len(d), v=round(float(d["valor"].sum()), 2), p=round(float(d["custo_prod"].sum()), 2),
        pl=round(float((d["custo_prod"] * d["qty"]).sum()), 2),
        lg=round(float(d["custo_log"].sum()), 2), oc=round(float(d["custo_occ"].sum()), 2),
        nO=int((d["c_order"] < 0).sum()), nL=int((d["c_lens"] < 0).sum()),
        t0=int((d["delay"] == 0).sum()), t1=int((d["delay"] == 1).sum()), t2=int((d["delay"] >= 2).sum()),
        dd=int(d.loc[d["delay"] > 0, "delay"].sum()), d2=int(d.loc[d["delay"] >= 2, "delay"].sum()),
        lowN=int(g["low"].sum()), lowNegO=int((g["low"] & (g["c_order"] < 0)).sum()),
        lowNegL=int((g["low"] & (g["c_lens"] < 0)).sum()),
        sp=round(float(s1["custo_prod"].sum()), 2), sb=round(float(s1["custo_base"].sum()), 2),
    )
    return [vals[m] for m in MEASURES]


rows = []
for (sh, yr, mo, gi), g in enc.groupby(["shop", "year", "month", "gidx"]):
    rows.append([int(sh), int(yr), int(mo), int(gi)] + cell(g))

sm = enc.groupby(["shop", "year", "num_lente"]).agg(o=("affected", "size"), a=("affected", "sum")).reset_index()
shop_model = [[int(r.shop), int(r.year), int(r.num_lente), int(r.o), int(r.a)] for r in sm.itertuples()]

# --- data-quality table by shop x year
dq_cols = ["dupN", "dupV", "unlN", "unlV", "fbT", "fbNo", "fbBef", "retD", "retB", "qtyEx",
           "incT", "missM", "missR", "fA", "fB", "fC"]
dqd = {(s, y): dict.fromkeys(dq_cols, 0) for s in range(len(shops)) for y in (2024, 2025)}

rawx = raw[dup_mask].copy()
rawx["year"] = pdate(rawx["data_encomenda"]).dt.year
rawx["shop"] = rawx["id_otica"].map(shop_idx)
rawx["v"] = num(rawx["valor_total"])
for (s, y), g in rawx.groupby(["shop", "year"]):
    dqd[(int(s), int(y))]["dupN"] += len(g)
    dqd[(int(s), int(y))]["dupV"] += round(float(g["v"].sum()), 2)

occx = occ.copy()
occx["shop"] = occx["id_otica"].map(shop_idx)
# 66 incidents are registered in Jan 2026; they are folded into 2025
occx["year"] = pdate(occx["data_registo"]).dt.year.clip(upper=2025)
for (s, y), g in occx.groupby(["shop", "year"]):
    k = dqd[(int(s), int(y))]
    k["incT"] += len(g)
    k["missM"] += int(g["motivo"].isna().sum())
    k["missR"] += int(g["resolucao"].isna().sum())
    un = g[~g["linked"]]
    k["unlN"] += len(un)
    k["unlV"] += round(float(un["custo"].sum()), 2)

om = occx[occx["linked"]].merge(enc[["id_encomenda", "qty", "real", "estado"]], on="id_encomenda")
om["dr"] = pdate(om["data_registo"])
for (s, y), g in om.groupby(["shop", "year"]):
    k = dqd[(int(s), int(y))]
    k["qtyEx"] += int((g["qa"] > g["qty"]).sum())
    r_ = g[(g["tipo_ocorrencia"] == "devolucao") & (g["estado"] == "entregue")]
    k["retD"] += len(r_)
    k["retB"] += int((r_["dr"] < r_["real"]).sum())

fbx = fb.merge(enc[["id_encomenda", "dt"]], on="id_encomenda", how="left", suffixes=("", "_o"))
fbx["shop"] = fbx["id_otica"].map(shop_idx)
fbx["year"] = pdate(fbx["data"]).dt.year
fbx["noorder"] = ~fbx["id_encomenda"].isin(valid_ids)
fbx["before"] = (fbx["dt"] < fbx["dt_o"]) & fbx["dt_o"].notna()
for (s, y), g in fbx.groupby(["shop", "year"]):
    k = dqd[(int(s), int(y))]
    k["fbT"] += len(g)
    k["fbNo"] += int(g["noorder"].sum())
    k["fbBef"] += int(g["before"].sum())

for (s, y), g in enc.groupby(["shop", "year"]):
    k = dqd[(int(s), int(y))]
    k["fA"] += int(g["id_encomenda"].str.match(r"^ENC\d{6}$").sum())
    k["fB"] += int(g["id_encomenda"].str.match(r"^\d{4}/\d{6}$").sum())
    k["fC"] += int(g["id_encomenda"].str.match(r"^ENC-\d{4}-\d{6}$").sum())

dq_rows = [[s, y] + [dqd[(s, y)][c] for c in dq_cols] for (s, y) in sorted(dqd)]

# sanity: totals must match the report
tot = {c: sum(r[2 + i] for r in dq_rows) for i, c in enumerate(dq_cols)}
assert tot["dupN"] == 1027 and tot["unlN"] == 185 and tot["fbNo"] == 2539, tot
assert tot["fbBef"] == 868 and tot["retB"] == 402 and tot["qtyEx"] == 305, tot
assert sum(r[4] for r in rows) == 51374
assert sum(r[4 + MEASURES.index("t2")] for r in rows) == 7466

cube = dict(
    shops=[dict(id=r["id"], name=r["cidade"]) for _, r in ot.iterrows()],
    measures=MEASURES,
    rows=rows,
    shopModel=shop_model,
    dqCols=dq_cols,
    dq=dq_rows,
)
(ROOT / "src" / "data" / "cube.json").write_text(
    json.dumps(cube, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("cube rows", len(rows), "size KB", round((ROOT / "src" / "data" / "cube.json").stat().st_size / 1024))
