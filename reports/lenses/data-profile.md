# Lens data profile

Companion to the [analysis report](report.md). Each table appears once. Raw counts include exact duplicate rows. Field profiles use the deduplicated analytical copy. A blank includes a null or a whitespace-only string. Numeric quantiles use linear interpolation.

## custos_logistica

51,374 raw rows, 6 columns, 0 exact repeats, 51,374 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 51,374 | Identifier |
| `id_encomenda` | Text | 0 | 51,374 | Identifier |
| `data` | Date | 0 | 731 | 2024-01-01 to 2025-12-31 |
| `transportadora` | Text | 0 | 4 | CTT (12,938), Transportes Rapidos (12,851), DHL (12,806), UPS (12,779) |
| `distancia_km` | Integer | 0 | 400 | Range 20.00 to 419.00, mean 219.67, quartiles 120.00 / 220.00 / 319.00 |
| `custo` | Decimal | 0 | 1,387 | Range 1.00 to 16.27, mean 8.11, quartiles 6.00 / 8.09 / 10.21 |

## encomendas_lentes

52,401 raw rows, 10 columns, 1,027 exact repeats, 51,374 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 51,374 | Identifier |
| `id_encomenda` | Text | 0 | 51,374 | Identifier |
| `id_otica` | Text | 0 | 12 | Identifier |
| `id_lente` | Text | 0 | 50 | Identifier |
| `data_encomenda` | Date | 0 | 731 | 2024-01-01 to 2025-12-31 |
| `quantidade` | Integer | 0 | 4 | Range 1.00 to 4.00, mean 1.37, quartiles 1.00 / 1.00 / 2.00, counts 1 (35,946), 2 (13,093), 3 (1,167), 4 (1,168) |
| `data_entrega_prevista` | Date | 0 | 737 | 2024-01-06 to 2026-01-11 |
| `data_entrega_real` | Date | 2,031 | 744 | 2024-01-06 to 2026-01-20 |
| `estado` | Text | 0 | 3 | entregue (49,343), em_producao (1,535), cancelada (496) |
| `valor_total` | Decimal | 0 | 26,876 | Range 15.19 to 1,164.89, mean 233.42, quartiles 125.15 / 202.94 / 272.53 |

## equipamentos_diagnostico

24 raw rows, 7 columns, 0 exact repeats, 24 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 24 | Identifier |
| `id_otica` | Text | 0 | 12 | Identifier |
| `modelo` | Text | 0 | 4 | OptiScan (10), VisionPro (7), ClearView (5), Precision 3 (2) |
| `data_instalacao` | Date | 0 | 24 | 2014-02-15 to 2023-09-21 |
| `ultima_manutencao` | Date | 0 | 24 | 2018-01-04 to 2025-12-09 |
| `estado` | Text | 0 | 3 | ativo (21), manutencao (2), desativado (1) |
| `tipo_tecnologia` | Text | 0 | 3 | hibrido (11), analogico (8), digital (5) |

## feedback_oticas

4,215 raw rows, 8 columns, 0 exact repeats, 4,215 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 4,215 | Identifier |
| `id_otica` | Text | 0 | 12 | Identifier |
| `id_encomenda` | Text | 2,539 | 1,652 | Identifier |
| `data` | Date | 0 | 725 | 2024-01-01 to 2025-12-30 |
| `satisfacao_geral` | Integer | 0 | 4 | Range 2.00 to 5.00, mean 3.77, quartiles 3.00 / 4.00 / 5.00, counts 2 (709), 3 (838), 4 (1,366), 5 (1,302) |
| `categoria_feedback` | Text | 0 | 5 | entrega (860), qualidade (849), atendimento (841), preco (833), produto (832) |
| `comentario` | Text | 366 | 10 | bom (400), otimo atendimento (397), preco justo (395), satisfeito (392), regular (385), Excelente (384), otima (383), entrega rapida (377), Bom (375), houve atraso (361) |
| `resolvido` | Boolean | 0 | 2 | True (2,942), False (1,273) |

## lentes_catalogo

50 raw rows, 8 columns, 0 exact repeats, 50 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 50 | Identifier |
| `modelo` | Text | 0 | 50 | Text labels |
| `categoria` | Text | 0 | 5 | progressiva (20), unifocal (10), bifocal (8), fotocromatica (6), tratamento_especial (6) |
| `tipo_tratamento` | Text | 0 | 5 | standard (15), anti_reflexo (10), premium_multicamada (10), uv (8), blue_cut (7) |
| `complexidade` | Integer | 0 | 5 | Range 1.00 to 5.00, mean 2.74, quartiles 2.00 / 3.00 / 3.75, counts 1 (10), 2 (11), 3 (16), 4 (8), 5 (5) |
| `preco_base` | Decimal | 0 | 50 | Range 46.14 to 292.42, mean 170.12, quartiles 112.90 / 164.79 / 244.57 |
| `custo_base_estimado` | Decimal | 0 | 50 | Range 26.43 to 169.27, mean 90.14, quartiles 56.42 / 87.47 / 119.02 |
| `duracao_producao_dias` | Integer | 0 | 7 | Range 3.00 to 9.00, mean 6.12, quartiles 5.00 / 6.00 / 7.00 |

## oticas_parceiras

12 raw rows, 9 columns, 0 exact repeats, 12 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 12 | Identifier |
| `nome` | Text | 0 | 12 | Text labels |
| `cidade` | Text | 0 | 12 | Text labels |
| `regiao` | Text | 0 | 5 | Centro (4), Norte (3), Lisboa (2), Sul (2), Ilhas (1) |
| `data_adesao` | Date | 0 | 11 | 2012-09-15 to 2020-06-15 |
| `nivel_certificacao` | Text | 0 | 3 | ouro (5), prata (5), bronze (2) |
| `dimensao` | Text | 0 | 3 | grande (5), media (5), pequena (2) |
| `perfil_clientes` | Text | 0 | 4 | geral (6), executivo (3), premium (2), infantil (1) |
| `estado_parceria` | Text | 0 | 3 | ativa (9), em_revisao (2), suspensa (1) |

## producao

51,374 raw rows, 7 columns, 0 exact repeats, 51,374 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 51,374 | Identifier |
| `id_encomenda` | Text | 0 | 51,374 | Identifier |
| `data_inicio` | Date | 0 | 733 | 2024-01-01 to 2026-01-02 |
| `data_fim` | Date | 0 | 739 | 2024-01-04 to 2026-01-11 |
| `horas` | Decimal | 0 | 671 | Range 2.30 to 9.00, mean 5.61, quartiles 4.59 / 5.61 / 6.63 |
| `custo_real` | Decimal | 0 | 19,239 | Range 23.82 to 274.19, mean 120.20, quartiles 65.51 / 108.92 / 160.90 |
| `operador` | Text | 0 | 10 | op10 (5,312), op06 (5,215), op09 (5,194), op04 (5,182), op08 (5,156), op05 (5,124), op03 (5,081), op02 (5,070), op07 (5,030), op01 (5,010) |

## retrabalho_devolucoes

3,201 raw rows, 10 columns, 0 exact repeats, 3,201 distinct record IDs.

| Field | Analytical type | Blank | Distinct populated values | Distribution or coverage |
|---|---|---:|---:|---|
| `id` | Text | 0 | 3,201 | Identifier |
| `id_encomenda` | Text | 0 | 3,091 | Identifier |
| `id_otica` | Text | 0 | 12 | Identifier |
| `id_lente` | Text | 0 | 50 | Identifier |
| `data_registo` | Date | 0 | 730 | 2024-01-03 to 2026-01-19 |
| `tipo_ocorrencia` | Text | 0 | 4 | retrabalho (1,494), devolucao (952), substituicao (460), ajuste (295) |
| `motivo` | Text | 377 | 8 | lente riscada (383), Erro de graduacao (372), tinte desigual (361), montagem (348), desconforto (343), erro de graduacao (342), avaria (340), graduacao errada (335) |
| `quantidade_afetada` | Integer | 0 | 2 | Range 1.00 to 2.00, mean 1.15, quartiles 1.00 / 1.00 / 1.00, counts 1 (2,727), 2 (474) |
| `custo_estimado` | Decimal | 0 | 3,048 | Range 10.84 to 474.71, mean 161.74, quartiles 79.28 / 144.28 / 212.36 |
| `resolucao` | Text | 564 | 5 | substituida (554), resolvido (532), em_analise (530), Resolvido (527), credito (494) |
