# Dados limpos para o Opticmizer

Esta pasta contém uma cópia das oito tabelas, em CSV e JSON, gerada a partir dos JSON de `public/data/lentes/json`. Os ficheiros de origem mantêm-se como referência. Os CSV usam UTF-8 com BOM, ponto e vírgula como separador e vírgula decimal. Os JSON contêm os mesmos registos e colunas.

As alterações e contagens por tabela estão em [auditoria.json](auditoria.json). Para reproduzir a cópia, executa `python reports/lentes/gerar_dados_limpos.py` a partir da raiz do projeto. O processo exige pandas.

- Foram retiradas 1 027 linhas de encomenda integralmente duplicadas. Os restantes registos foram conservados, incluindo as 185 ocorrências sem correspondência.
- As 1 383 datas de encomenda em dia/mês/ano passaram para ano-mês-dia. As restantes datas já estavam em formato ISO.
- O código original da encomenda foi conservado. Nas linhas com correspondência exata foi acrescentado `id_encomenda_normalizado` no formato `ENC000001`. A sequência de seis dígitos é única entre as encomendas e os anos explícitos são consistentes. O campo fica vazio nas ocorrências sem correspondência e nos feedbacks sem código.
- `estado_associacao_encomenda` identifica as referências associadas, ausentes e sem correspondência exata. Os oito sufixos de ocorrências órfãs que coincidem com um sufixo de encomenda não foram associados automaticamente.
- Foram acrescentadas colunas normalizadas para texto em minúsculas. As grafias originais e os sinónimos foram preservados.
- Não foram preenchidos valores em falta nem corrigidas datas, quantidades ou estados cuja interpretação depende do negócio.

Para calcular a contribuição por encomenda, agrega primeiro as ocorrências pelo código normalizado e soma `custo_estimado`. Liga depois a produção e a logística. A interpretação de `custo_real` como custo por encomenda ou por lente continua por confirmar.
