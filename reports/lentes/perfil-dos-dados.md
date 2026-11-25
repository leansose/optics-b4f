# Perfil dos dados da cadeia de lentes

Anexo ao [relatório do desafio](relatorio.md). A contagem original inclui linhas repetidas. As estatísticas por campo usam a cópia sem duplicados exatos. Consideram-se em falta os valores nulos e os textos vazios. Os quartis usam interpolação linear. As categorias e os códigos mantêm a grafia da fonte.

## custos_logistica

51 374 linhas originais, 6 campos, 0 repetições exatas, 51 374 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 51 374 | Identificador |
| `id_encomenda` | Texto | 0 | 51 374 | Identificador |
| `data` | Data | 0 | 731 | 2024-01-01 a 2025-12-31 |
| `transportadora` | Texto | 0 | 4 | CTT (12 938), Transportes Rapidos (12 851), DHL (12 806), UPS (12 779) |
| `distancia_km` | Inteiro | 0 | 400 | Intervalo 20,00 a 419,00, média 219,67, quartis 120,00 / 220,00 / 319,00 |
| `custo` | Decimal | 0 | 1 387 | Intervalo 1,00 a 16,27, média 8,11, quartis 6,00 / 8,09 / 10,21 |

## encomendas_lentes

52 401 linhas originais, 10 campos, 1 027 repetições exatas, 51 374 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 51 374 | Identificador |
| `id_encomenda` | Texto | 0 | 51 374 | Identificador |
| `id_otica` | Texto | 0 | 12 | Identificador |
| `id_lente` | Texto | 0 | 50 | Identificador |
| `data_encomenda` | Data | 0 | 731 | 2024-01-01 a 2025-12-31 |
| `quantidade` | Inteiro | 0 | 4 | Intervalo 1,00 a 4,00, média 1,37, quartis 1,00 / 1,00 / 2,00, contagens 1 (35 946), 2 (13 093), 3 (1 167), 4 (1 168) |
| `data_entrega_prevista` | Data | 0 | 737 | 2024-01-06 a 2026-01-11 |
| `data_entrega_real` | Data | 2 031 | 744 | 2024-01-06 a 2026-01-20 |
| `estado` | Texto | 0 | 3 | entregue (49 343), em_producao (1 535), cancelada (496) |
| `valor_total` | Decimal | 0 | 26 876 | Intervalo 15,19 a 1 164,89, média 233,42, quartis 125,15 / 202,94 / 272,53 |

## equipamentos_diagnostico

24 linhas originais, 7 campos, 0 repetições exatas, 24 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 24 | Identificador |
| `id_otica` | Texto | 0 | 12 | Identificador |
| `modelo` | Texto | 0 | 4 | OptiScan (10), VisionPro (7), ClearView (5), Precision 3 (2) |
| `data_instalacao` | Data | 0 | 24 | 2014-02-15 a 2023-09-21 |
| `ultima_manutencao` | Data | 0 | 24 | 2018-01-04 a 2025-12-09 |
| `estado` | Texto | 0 | 3 | ativo (21), manutencao (2), desativado (1) |
| `tipo_tecnologia` | Texto | 0 | 3 | hibrido (11), analogico (8), digital (5) |

## feedback_oticas

4 215 linhas originais, 8 campos, 0 repetições exatas, 4 215 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 4 215 | Identificador |
| `id_otica` | Texto | 0 | 12 | Identificador |
| `id_encomenda` | Texto | 2 539 | 1 652 | Identificador |
| `data` | Data | 0 | 725 | 2024-01-01 a 2025-12-30 |
| `satisfacao_geral` | Inteiro | 0 | 4 | Intervalo 2,00 a 5,00, média 3,77, quartis 3,00 / 4,00 / 5,00, contagens 2 (709), 3 (838), 4 (1 366), 5 (1 302) |
| `categoria_feedback` | Texto | 0 | 5 | entrega (860), qualidade (849), atendimento (841), preco (833), produto (832) |
| `comentario` | Texto | 366 | 10 | bom (400), otimo atendimento (397), preco justo (395), satisfeito (392), regular (385), Excelente (384), otima (383), entrega rapida (377), Bom (375), houve atraso (361) |
| `resolvido` | Booleano | 0 | 2 | True (2 942), False (1 273) |

## lentes_catalogo

50 linhas originais, 8 campos, 0 repetições exatas, 50 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 50 | Identificador |
| `modelo` | Texto | 0 | 50 | Rótulos |
| `categoria` | Texto | 0 | 5 | progressiva (20), unifocal (10), bifocal (8), fotocromatica (6), tratamento_especial (6) |
| `tipo_tratamento` | Texto | 0 | 5 | standard (15), anti_reflexo (10), premium_multicamada (10), uv (8), blue_cut (7) |
| `complexidade` | Inteiro | 0 | 5 | Intervalo 1,00 a 5,00, média 2,74, quartis 2,00 / 3,00 / 3,75, contagens 1 (10), 2 (11), 3 (16), 4 (8), 5 (5) |
| `preco_base` | Decimal | 0 | 50 | Intervalo 46,14 a 292,42, média 170,12, quartis 112,90 / 164,79 / 244,57 |
| `custo_base_estimado` | Decimal | 0 | 50 | Intervalo 26,43 a 169,27, média 90,14, quartis 56,42 / 87,47 / 119,02 |
| `duracao_producao_dias` | Inteiro | 0 | 7 | Intervalo 3,00 a 9,00, média 6,12, quartis 5,00 / 6,00 / 7,00 |

## oticas_parceiras

12 linhas originais, 9 campos, 0 repetições exatas, 12 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 12 | Identificador |
| `nome` | Texto | 0 | 12 | Rótulos |
| `cidade` | Texto | 0 | 12 | Rótulos |
| `regiao` | Texto | 0 | 5 | Centro (4), Norte (3), Lisboa (2), Sul (2), Ilhas (1) |
| `data_adesao` | Data | 0 | 11 | 2012-09-15 a 2020-06-15 |
| `nivel_certificacao` | Texto | 0 | 3 | ouro (5), prata (5), bronze (2) |
| `dimensao` | Texto | 0 | 3 | grande (5), media (5), pequena (2) |
| `perfil_clientes` | Texto | 0 | 4 | geral (6), executivo (3), premium (2), infantil (1) |
| `estado_parceria` | Texto | 0 | 3 | ativa (9), em_revisao (2), suspensa (1) |

## producao

51 374 linhas originais, 7 campos, 0 repetições exatas, 51 374 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 51 374 | Identificador |
| `id_encomenda` | Texto | 0 | 51 374 | Identificador |
| `data_inicio` | Data | 0 | 733 | 2024-01-01 a 2026-01-02 |
| `data_fim` | Data | 0 | 739 | 2024-01-04 a 2026-01-11 |
| `horas` | Decimal | 0 | 671 | Intervalo 2,30 a 9,00, média 5,61, quartis 4,59 / 5,61 / 6,63 |
| `custo_real` | Decimal | 0 | 19 239 | Intervalo 23,82 a 274,19, média 120,20, quartis 65,51 / 108,92 / 160,90 |
| `operador` | Texto | 0 | 10 | op10 (5 312), op06 (5 215), op09 (5 194), op04 (5 182), op08 (5 156), op05 (5 124), op03 (5 081), op02 (5 070), op07 (5 030), op01 (5 010) |

## retrabalho_devolucoes

3 201 linhas originais, 10 campos, 0 repetições exatas, 3 201 identificadores distintos.

| Campo | Tipo analítico | Em falta | Valores distintos preenchidos | Distribuição ou cobertura |
|---|---|---:|---:|---|
| `id` | Texto | 0 | 3 201 | Identificador |
| `id_encomenda` | Texto | 0 | 3 091 | Identificador |
| `id_otica` | Texto | 0 | 12 | Identificador |
| `id_lente` | Texto | 0 | 50 | Identificador |
| `data_registo` | Data | 0 | 730 | 2024-01-03 a 2026-01-19 |
| `tipo_ocorrencia` | Texto | 0 | 4 | retrabalho (1 494), devolucao (952), substituicao (460), ajuste (295) |
| `motivo` | Texto | 377 | 8 | lente riscada (383), Erro de graduacao (372), tinte desigual (361), montagem (348), desconforto (343), erro de graduacao (342), avaria (340), graduacao errada (335) |
| `quantidade_afetada` | Inteiro | 0 | 2 | Intervalo 1,00 a 2,00, média 1,15, quartis 1,00 / 1,00 / 1,00, contagens 1 (2 727), 2 (474) |
| `custo_estimado` | Decimal | 0 | 3 048 | Intervalo 10,84 a 474,71, média 161,74, quartis 79,28 / 144,28 / 212,36 |
| `resolucao` | Texto | 564 | 5 | substituida (554), resolvido (532), em_analise (530), Resolvido (527), credito (494) |
