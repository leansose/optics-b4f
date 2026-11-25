"""Gera uma cópia normalizada dos ficheiros de lentes e um registo das alterações."""

from pathlib import Path
import json
import re

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public" / "data" / "lentes" / "json"
OUTPUT = ROOT / "reports" / "lentes" / "dados-limpos"
OUTPUT.mkdir(parents=True, exist_ok=True)

tables = {
    path.stem: pd.DataFrame(json.loads(path.read_text(encoding="utf-8-sig")))
    for path in sorted(SOURCE.glob("*.json"))
}
if len(tables) != 8:
    raise ValueError("São esperadas oito tabelas de origem.")

audit = {}
for name, frame in tables.items():
    before = len(frame)
    cleaned = frame.drop_duplicates().copy()
    if cleaned["id"].duplicated().any():
        raise ValueError(f"Existem identificadores repetidos e diferentes em {name}.")
    audit[name] = {
        "linhas_origem": before,
        "duplicados_exatos_removidos": before - len(cleaned),
        "linhas_limpas": len(cleaned),
        "datas_convertidas": {},
    }
    for column in cleaned.columns:
        if not (column.startswith("data") or column == "ultima_manutencao"):
            continue
        values = cleaned[column].astype("string")
        is_dmy = values.str.fullmatch(r"\d{2}/\d{2}/\d{4}", na=False)
        is_iso = values.str.fullmatch(r"\d{4}-\d{2}-\d{2}", na=False)
        invalid = values.notna() & ~(is_dmy | is_iso)
        if invalid.any():
            raise ValueError(f"Formato de data desconhecido em {name}.{column}.")
        parsed = pd.to_datetime(values.where(is_iso), format="%Y-%m-%d")
        parsed = parsed.fillna(pd.to_datetime(values.where(is_dmy), format="%d/%m/%Y"))
        cleaned[column] = parsed.dt.strftime("%Y-%m-%d")
        audit[name]["datas_convertidas"][column] = int(is_dmy.sum())
    tables[name] = cleaned

orders = tables["encomendas_lentes"]
if orders["id_encomenda"].duplicated().any():
    raise ValueError("Os códigos de encomenda não são únicos.")

# O sufixo só identifica uma encomenda depois de verificadas as regras do código
# e a sua unicidade. Os códigos originais mantêm-se para permitir auditoria.
pattern = re.compile(r"^(?:ENC(?P<plain>\d{6})|(?P<year1>\d{4})/(?P<slash>\d{6})|ENC-(?P<year2>\d{4})-(?P<dash>\d{6}))$")

def sequence(code):
    if not isinstance(code, str):
        return None
    match = pattern.fullmatch(code)
    if not match:
        return None
    return match.group("plain") or match.group("slash") or match.group("dash")

order_sequence = orders["id_encomenda"].map(sequence)
if order_sequence.isna().any() or order_sequence.duplicated().any():
    raise ValueError("O número de sequência das encomendas não é único.")
for code, date in zip(orders["id_encomenda"], orders["data_encomenda"]):
    match = pattern.fullmatch(code)
    year = match.group("year1") or match.group("year2")
    if year and year != date[:4]:
        raise ValueError(f"Ano incompatível no código {code}.")

order_codes = set(orders["id_encomenda"])
for name, frame in tables.items():
    if "id_encomenda" not in frame:
        continue
    present = frame["id_encomenda"].notna() & frame["id_encomenda"].ne("")
    exact = present & frame["id_encomenda"].isin(order_codes)
    frame["id_encomenda_normalizado"] = frame["id_encomenda"].where(exact).map(
        lambda code: f"ENC{sequence(code)}" if isinstance(code, str) else None
    )
    frame["estado_associacao_encomenda"] = "sem_codigo"
    frame.loc[present, "estado_associacao_encomenda"] = "sem_correspondencia_exata"
    frame.loc[exact, "estado_associacao_encomenda"] = "associada"
    audit[name]["associacao_encomenda"] = {
        str(key): int(value)
        for key, value in frame["estado_associacao_encomenda"].value_counts().items()
    }

events = tables["retrabalho_devolucoes"]
events["motivo_normalizado"] = events["motivo"].str.strip().str.lower()
events["resolucao_normalizada"] = events["resolucao"].str.strip().str.lower()
feedback = tables["feedback_oticas"]
feedback["comentario_normalizado"] = feedback["comentario"].str.strip().str.lower()
audit["transformacoes"] = {
    "fontes": "JSON de origem, equivalentes aos CSV verificados anteriormente",
    "duplicados": "Apenas linhas integralmente iguais; identificadores originais preservados.",
    "datas": "Datas dia/mês/ano convertidas para ano-mês-dia; datas ISO preservadas.",
    "codigos": "Código normalizado acrescentado apenas após associação exata. Os códigos originais são preservados.",
    "categorias": "Acrescentadas colunas em minúsculas para motivos, resoluções e comentários. Sinónimos não são fundidos.",
    "valores_em_falta": "Não foram imputados valores nem corrigidas datas ou quantidades inconsistentes.",
}

for name, frame in tables.items():
    frame.to_csv(
        OUTPUT / f"{name}.csv",
        index=False,
        sep=";",
        decimal=",",
        encoding="utf-8-sig",
        lineterminator="\n",
    )
    frame.to_json(
        OUTPUT / f"{name}.json",
        orient="records",
        force_ascii=False,
        indent=2,
    )

(OUTPUT / "auditoria.json").write_text(
    json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(audit, ensure_ascii=False, indent=2))
