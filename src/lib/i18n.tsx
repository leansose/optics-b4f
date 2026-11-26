"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

const STORAGE_KEY = "opticmizer-lang";

const en = {
  "common.decision": "Decision:",
  "common.stepOf": "{current} of 4",
  "common.all": "All",
  "common.of": "of",
  "common.reset": "Reset",
  "common.resetFilters": "Reset filters",
  "common.search": "Search",
  "common.clear": "Clear",
  "common.unknown": "Unknown",
  "common.lens": "lens",
  "common.lenses": "lenses",
  "common.order": "order",
  "common.filters": "Filters",
  "common.shop": "Shop",
  "common.year": "Year",
  "common.models": "Models",
  "common.orders": "Orders",
  "common.orderValue": "Order value",
  "common.production": "Production",
  "common.logistics": "Logistics",
  "common.incident": "Incident",
  "common.incidents": "Incidents",
  "common.contribution": "Contribution",
  "common.costs": "Costs",
  "common.costBasis": "Production cost basis",
  "common.otherCosts": "Other costs",
  "common.perOrder": "Per order",
  "common.perLens": "Per lens",
  "common.current": "Current",
  "common.projected": "Projected",
  "common.profit": "Profit",
  "common.totalChange": "Total change",
  "common.network": "network",
  "common.catalogue": "catalogue",
  "common.delivered": "delivered",

  "nav.home": "Opticmizer home",
  "nav.main": "Main",
  "nav.production": "Production",
  "nav.finance": "Finance",
  "nav.product": "Product",
  "nav.simulator": "Simulator",

  "theme.toLight": "Switch to light mode",
  "theme.toDark": "Switch to dark mode",
  "lang.toPortuguese": "Switch to Portuguese",
  "lang.toEnglish": "Switch to English",
  "meta.description":
    "Decision support for a 12-shop lens network: quality, finance, product and scenario simulation.",

  "order.search": "Search orders",
  "order.placeholder": "Search code, city, model or year",
  "order.list": "Orders",
  "order.empty": "No matching orders — try a shop, city, model, or year.",
  "order.showing": "Showing {shown} of {total} · type to narrow",
  "order.none": "No orders for these filters",

  "production.title": "Quality: where problems start",
  "production.statOrders": "orders with an incident",
  "production.statIncidentCost": "incident cost",
  "production.statVsCatalogue": "production vs catalogue",
  "production.singleLens": "single-lens orders",
  "production.ordersNote": "{affected} of {orders} · {network} {rate}",
  "production.networkShare": "{share} of {network}",
  "production.cardGroups": "Problem rate by model group",
  "production.groupsAria":
    "Problem rate by model group with the network average reference line",
  "production.problemRate": "Problem rate",
  "production.groupOther": "Other models",
  "production.ratio": "{ratio}× higher for L001–L012",
  "production.ratioSuffix": "higher for L001–L012",
  "production.groupNote":
    "Dashed line = network rate. Select one model above to highlight its group.",
  "production.cardShops": "Shops: observed vs adjusted rate",
  "production.shopsAria":
    "Observed and adjusted problem rate by shop; click a bar to filter by shop",
  "production.observed": "Observed",
  "production.adjusted": "Adjusted",
  "production.adjustedLegend": "Adjusted = network model mix",
  "production.shopNote": "Dashed line = {network} · click a bar to filter",
  "production.noOrders": "No orders for these filters.",

  "finance.title": "Finance: what each order contributes",
  "finance.metricContribution": "Estimated contribution",
  "finance.metricLosing": "Orders that lose money",
  "finance.metricLowPrice": "Low-price orders lose money",
  "finance.contributionNote": "{orders} delivered orders · {basis}",
  "finance.deliveriesNote": "{share} of deliveries",
  "finance.lowNote": "{low} vs {high} at normal price",
  "finance.cardFlow": "Where the money goes",
  "finance.flowSub": "From order value to contribution, step by step",
  "finance.costUnit": "Production cost unit",
  "finance.costMix": "Cost mix",
  "finance.transparent": "Transparent base = running total",
  "finance.noOrdersSelection": "No delivered orders for this selection.",
  "finance.noOrdersFilters": "No delivered orders for these filters.",
  "finance.currencyNote":
    "Amounts are shown in €; the source files did not state a currency. Production is the only cost with two possible interpretations.",
  "finance.modeOrder": "Cost per order",
  "finance.modeLens": "Cost per lens",
  "finance.cardInspect": "Inspect one order",
  "finance.waterfallAria":
    "Waterfall from order value through production, logistics and incidents to contribution",
  "finance.loses": "Loses",
  "finance.earns": "Earns",
  "finance.perUnit": "per {unit}",
  "finance.productionQty": "Production ({unit} × {qty})",

  "product.title": "Product and Performance",
  "product.statShown": "lens models shown",
  "product.statShownNote": "models matching the table filters",
  "product.statOrders": "orders in the visible models",
  "product.statOrdersNote": "shop, year and model filters applied",
  "product.statIncidentNote": "average {catalogue} margin {margin}",
  "product.searchModels": "Search models",
  "product.searchPlaceholder": "Search model, category or treatment",
  "product.price": "Price",
  "product.minPrice": "Minimum base price",
  "product.maxPrice": "Maximum base price",
  "product.min": "min",
  "product.max": "max",
  "product.clearTable": "Clear table filters",
  "product.visible": "{shown} of {total} lenses · {orders} orders in view",
  "product.sortHint": "Click a column heading to sort · amounts in €",
  "product.caption":
    "Product catalogue with order and cost metrics for the current filters",
  "product.noMatch": "No lens matches these filters.",
  "product.footer":
    "Catalogue: {count} lenses · Columns marked “{catalogue}” are list prices, not invoiced amounts. Contribution follows the two production-cost interpretations used on the Finance page.",
  "product.sortBy": "Sort by {label}{hint}",

  "product.column.model": "Model",
  "product.column.category": "Category",
  "product.column.treatment": "Treatment",
  "product.column.complexity": "Complexity",
  "product.column.basePrice": "Base price",
  "product.column.baseCost": "Base cost",
  "product.column.margin": "Margin",
  "product.column.orders": "Orders",
  "product.column.lenses": "Lenses",
  "product.column.incidents": "Incidents",
  "product.column.revenue": "Revenue",
  "product.column.contributionOrder": "Contrib. / order",
  "product.column.contributionLens": "Contrib. / lens",
  "product.hint.catalogue": "catalogue",
  "product.hint.delivered": "delivered",
  "product.hint.shareOrders": "share of orders",

  "simulator.title": "Simulator: test profit levers",
  "simulator.decisionNoOrders":
    "No delivered orders in this selection. Change the shop or year to test a scenario.",
  "simulator.decisionNoRanges":
    "Add a range to model a change. The current filters apply to every lever.",
  "simulator.decisionRanges":
    "{profit} projected profit after {count} {rangeWord}. Biggest driver: {driver}.",
  "simulator.statCurrent": "profit on current filters",
  "simulator.statChange": "change from ranges",
  "simulator.statProjected": "projected profit",
  "simulator.currentNote": "{orders} delivered orders · cost {basis}",
  "simulator.vsCurrent": "{pct} vs current",
  "simulator.rangeOne": "range",
  "simulator.rangeMany": "ranges",
  "simulator.activeRanges": "{count} active {rangeWord}",
  "simulator.cardAdjust": "Adjust the ranges",
  "simulator.intro":
    "Type a number or drag a slider. Each range changes one driver.",
  "simulator.driver": "Driver",
  "simulator.amount": "Amount",
  "simulator.cap": "Capped at {cap}% for this driver.",
  "simulator.noRanges": "No ranges yet. Add one to start testing scenarios.",
  "simulator.addRange": "Add range",
  "simulator.removeRange": "Remove {label} range",
  "simulator.percentage": "{label} percentage",
  "simulator.disclaimer":
    "Scenario arithmetic on 2024–2025 history, not a forecast. Each driver is capped at 100% even with several ranges.",
  "simulator.cardCompare": "Current vs projected",
  "simulator.noDelivered":
    "No delivered orders — adjust the shop or year filters.",
  "simulator.chartAria":
    "Current and projected profit after the selected ranges",
  "simulator.cardBreakdown": "Range breakdown",
  "simulator.breakdownEmpty":
    "Add a range to see how much each lever moves profit.",
  "simulator.target.value": "Order value",
  "simulator.target.production": "Production cost",
  "simulator.target.logistics": "Logistics cost",
  "simulator.target.incidents": "Incident cost",
  "simulator.target.delivery": "Delivered orders",
  "simulator.option.value": "Order value (+%)",
  "simulator.option.production": "Production cost (−%)",
  "simulator.option.logistics": "Logistics cost (−%)",
  "simulator.option.incidents": "Incident cost (−%)",
  "simulator.option.delivery": "Delivered orders (+%)",
  "simulator.hint.value": "Higher prices add the full increase to profit.",
  "simulator.hint.production":
    "Lower production cost adds the saving to profit.",
  "simulator.hint.logistics": "Lower logistics cost adds the saving to profit.",
  "simulator.hint.incidents":
    "Fewer or cheaper incidents add the saving to profit.",
  "simulator.hint.delivery":
    "Extra deliveries earn today's profit per delivered order.",
  "simulator.target.profit": "Profit after all costs",
  "simulator.option.profit": "Profit after costs (+%)",
  "simulator.hint.profit":
    "Raises net profit after production, incidents and delivery.",

  "dm.title": "Decision maker",
  "dm.subtitle": "Where to act first for the selected optician and models",
  "dm.optician": "Optician",
  "dm.model": "Model",
  "dm.basis": "Production cost applied",
  "dm.modelAll": "All models",
  "dm.modelGroup0": "Progressive L001–L012",
  "dm.modelGroup1": "L013–L020",
  "dm.modelGroup2": "Other models",
  "dm.allShops": "all shops",
  "dm.noData":
    "No delivered orders in this selection. Change the optician or model.",
  "dm.alertTitle": "Where to act first?",
  "dm.alertIncidents":
    "Investigate the incidents that erased {share} of order value on {models} at {shop} — about {amount} across {orders} deliveries.",
  "dm.alertMargin":
    "Confirm the production-cost basis before changing prices for {models} at {shop}.",
  "dm.alertService":
    "Service is stable at {shop}; keep watching {models} for new incidents.",
  "dm.colIndicator": "Indicator",
  "dm.colValue": "Historical value",
  "dm.colAction": "Suggested step",
  "dm.indicatorIncidents": "Margin lost to incidents",
  "dm.indicatorMargin": "Margin before incidents",
  "dm.indicatorSatisfaction": "Optician satisfaction",
  "dm.incidentsNote": "{amount} incident cost · {orders} deliveries",
  "dm.marginNote": "After incidents: {margin}",
  "dm.satisfactionNote": "{count} shop reviews · {shop}",
  "dm.actionIncidents": "Review incident causes on {models} at {shop}.",
  "dm.actionMargin": "Confirm with production that cost is {basis}.",
  "dm.actionSatisfaction": "Review feedback categories with {shop}.",
  "dm.meaningTitle": "What these figures mean",
  "dm.meaningIncidents":
    "Margin lost to incidents is incident cost divided by order value for this selection.",
  "dm.meaningMargin":
    "Margin before incidents is (order value − production − logistics) ÷ order value. Incident cost is excluded here and shown on the first row.",
  "dm.meaningSatisfaction":
    "Satisfaction is the mean rating in the feedback file for the selected optician. Ratings are not reliably linked to orders or models, so the model filter does not change this figure.",
  "dm.actionsTitle": "How to act on this",
  "dm.actionsBody":
    "1. Confirm the production-cost basis with the production team. 2. Review incident causes on the heaviest model group before changing prices. 3. Check low-price orders that lose money on the Finance page. 4. Fix feedback links and dates before attributing satisfaction to a model.",
  "dm.problemsTitle": "Problems found in this selection",
  "dm.noProblem":
    "No dominant problem appears in this selection. Keep watching the indicators above.",
  "dm.problemCity": "At {shop}, the largest incident driver is {cause}.",
  "dm.problemModel":
    "For {models} at {shop}, the largest incident driver is {cause}.",
  "dm.problemCauseDetail":
    "{count} linked incident records · {cost} incident cost · {share} of cost in this scope.",
  "dm.problemLowPrice":
    "Low-price orders lose money in {share} of cases ({neg} of {low}).",
  "dm.problemLowPriceDetail":
    "Their price does not cover production and logistics, so they reduce contribution even when delivered.",
  "dm.problemSatisfaction":
    "Satisfaction at {shop} is {score}/5, below the 4.2 reference.",
  "dm.problemSatisfactionDetail":
    "Based on {count} shop reviews; feedback is not linked to models.",
  "dm.actionsIntro": "One action per problem above, in the same order:",
  "dm.typeAdjustment": "adjustment",
  "dm.typeRework": "rework",
  "dm.typeReturn": "return",
  "dm.typeReplacement": "replacement",
  "dm.motiveUnspecified": "no recorded motive",
  "dm.motiveWrongGraduation": "wrong graduation",
  "dm.motiveScratchedLens": "scratched lens",
  "dm.motiveMounting": "mounting",
  "dm.motiveDiscomfort": "discomfort",
  "dm.motiveDamage": "damage",
  "dm.motiveUnevenTint": "uneven tint",
  "dm.fixWrongGraduation":
    "Recheck prescription entry and final fit for {models} at {shop}; sample the affected orders before changing prices.",
  "dm.fixScratchedLens":
    "Inspect lens storage and handling for {models} at {shop} and replace damaged stock before it reaches customers.",
  "dm.fixMounting":
    "Audit the mounting step for {models} at {shop} with the fitting team and record each check.",
  "dm.fixDiscomfort":
    "Add a comfort check to the fitting of {models} at {shop} and follow up on reported cases.",
  "dm.fixDamage":
    "Review packaging and transport for {models} at {shop} and log damage per batch.",
  "dm.fixUnevenTint":
    "Check tint batch quality for {models} at {shop} and hold questionable batches.",
  "dm.fixUnspecified":
    "Record the incident motive for {models} at {shop} so the next review can target a cause.",
  "dm.fixAdjustment":
    "Review adjustment requests for {models} at {shop} and tighten the final fit check.",
  "dm.fixRework":
    "Trace rework steps for {models} at {shop} and remove the repeated defect before accepting more orders.",
  "dm.fixReturn":
    "Review return reasons for {models} at {shop} and confirm the order specification before dispatch.",
  "dm.fixReplacement":
    "Check replacement stock and order accuracy for {models} at {shop} before shipping.",
  "dm.fixLowPrice":
    "Set a minimum price for {models} at {shop} and review the flagged orders on the Finance page.",
  "dm.fixSatisfaction":
    "Review feedback categories with {shop} and close unresolved complaints before adding promotions.",
  "dm.fixNone":
    "Keep monitoring {models} at {shop} and repeat this review when incident cost rises.",

  "finance.inspectFilters": "Order list filters",

  "value.progressiva": "Progressiva",
  "value.unifocal": "Unifocal",
  "value.bifocal": "Bifocal",
  "value.fotocromatica": "Fotochromatic",
  "value.tratamento_especial": "Special treatment",
  "value.standard": "Standard",
  "value.uv": "UV",
  "value.anti_reflexo": "Anti-reflective",
  "value.premium_multicamada": "Premium multi-coat",
  "value.blue_cut": "Blue cut",
} as const;

export type TranslationKey = keyof typeof en;
type TranslationVars = Record<string, string | number>;

const pt: Record<TranslationKey, string> = {
  "common.decision": "Decisão:",
  "common.stepOf": "{current} de 4",
  "common.all": "Todos",
  "common.of": "de",
  "common.reset": "Repor",
  "common.resetFilters": "Repor filtros",
  "common.search": "Pesquisar",
  "common.clear": "Limpar",
  "common.unknown": "Desconhecido",
  "common.lens": "lente",
  "common.lenses": "lentes",
  "common.order": "encomenda",
  "common.filters": "Filtros",
  "common.shop": "Loja",
  "common.year": "Ano",
  "common.models": "Modelos",
  "common.orders": "Encomendas",
  "common.orderValue": "Valor da encomenda",
  "common.production": "Produção",
  "common.logistics": "Logística",
  "common.incident": "Incidente",
  "common.incidents": "Incidentes",
  "common.contribution": "Contribuição",
  "common.costs": "Custos",
  "common.costBasis": "Base do custo de produção",
  "common.otherCosts": "Outros custos",
  "common.perOrder": "Por encomenda",
  "common.perLens": "Por lente",
  "common.current": "Atual",
  "common.projected": "Projetado",
  "common.profit": "Lucro",
  "common.totalChange": "Variação total",
  "common.network": "rede",
  "common.catalogue": "catálogo",
  "common.delivered": "entregues",

  "nav.home": "Página inicial da Opticmizer",
  "nav.main": "Principal",
  "nav.production": "Produção",
  "nav.finance": "Finanças",
  "nav.product": "Produto",
  "nav.simulator": "Simulador",

  "theme.toLight": "Mudar para modo claro",
  "theme.toDark": "Mudar para modo escuro",
  "lang.toPortuguese": "Mudar para português",
  "lang.toEnglish": "Mudar para inglês",
  "meta.description":
    "Apoio à decisão para uma rede de 12 lojas de lentes: qualidade, finanças, produto e simulação de cenários.",

  "order.search": "Pesquisar encomendas",
  "order.placeholder": "Pesquisar código, cidade, modelo ou ano",
  "order.list": "Encomendas",
  "order.empty":
    "Sem encomendas correspondentes — experimente loja, cidade, modelo ou ano.",
  "order.showing": "A mostrar {shown} de {total} · escreva para filtrar",
  "order.none": "Sem encomendas para estes filtros",

  "production.title": "Qualidade: onde começam os problemas",
  "production.statOrders": "encomendas com incidente",
  "production.statIncidentCost": "custo de incidentes",
  "production.statVsCatalogue": "produção vs catálogo",
  "production.singleLens": "encomendas de lente única",
  "production.ordersNote": "{affected} de {orders} · {network} {rate}",
  "production.networkShare": "{share} da {network}",
  "production.cardGroups": "Taxa de problemas por grupo de modelos",
  "production.groupsAria":
    "Taxa de problemas por grupo de modelos com a linha de referência da média da rede",
  "production.problemRate": "Taxa de problemas",
  "production.groupOther": "Outros modelos",
  "production.ratio": "{ratio}× superior para L001–L012",
  "production.ratioSuffix": "superior para L001–L012",
  "production.groupNote":
    "Linha tracejada = taxa da rede. Selecione um modelo acima para realçar o seu grupo.",
  "production.cardShops": "Lojas: taxa observada vs ajustada",
  "production.shopsAria":
    "Taxa de problemas observada e ajustada por loja; clique numa barra para filtrar por loja",
  "production.observed": "Observada",
  "production.adjusted": "Ajustada",
  "production.adjustedLegend": "Ajustada = mix de modelos da rede",
  "production.shopNote":
    "Linha tracejada = {network} · clique numa barra para filtrar",
  "production.noOrders": "Sem encomendas para estes filtros.",

  "finance.title": "Finanças: o que cada encomenda contribui",
  "finance.metricContribution": "Contribuição estimada",
  "finance.metricLosing": "Encomendas que dão prejuízo",
  "finance.metricLowPrice": "Encomendas de baixo preço dão prejuízo",
  "finance.contributionNote": "{orders} encomendas entregues · {basis}",
  "finance.deliveriesNote": "{share} das entregas",
  "finance.lowNote": "{low} vs {high} a preço normal",
  "finance.cardFlow": "Para onde vai o dinheiro",
  "finance.flowSub": "Do valor da encomenda à contribuição, passo a passo",
  "finance.costUnit": "Base do custo de produção",
  "finance.costMix": "Composição dos custos",
  "finance.transparent": "Base transparente = total acumulado",
  "finance.noOrdersSelection": "Sem encomendas entregues para esta seleção.",
  "finance.noOrdersFilters": "Sem encomendas entregues para estes filtros.",
  "finance.currencyNote":
    "Os valores são apresentados em €; os ficheiros de origem não indicavam a moeda. A produção é o único custo com duas interpretações possíveis.",
  "finance.modeOrder": "Custo por encomenda",
  "finance.modeLens": "Custo por lente",
  "finance.cardInspect": "Inspecionar uma encomenda",
  "finance.waterfallAria":
    "Cascata do valor da encomenda pela produção, logística e incidentes até à contribuição",
  "finance.loses": "Perde",
  "finance.earns": "Ganha",
  "finance.perUnit": "por {unit}",
  "finance.productionQty": "Produção ({unit} × {qty})",

  "product.title": "Produto e Desempenho",
  "product.statShown": "modelos de lente apresentados",
  "product.statShownNote": "modelos que correspondem aos filtros da tabela",
  "product.statOrders": "encomendas nos modelos visíveis",
  "product.statOrdersNote": "filtros de loja, ano e modelo aplicados",
  "product.statIncidentNote": "margem média de {catalogue} {margin}",
  "product.searchModels": "Pesquisar modelos",
  "product.searchPlaceholder": "Pesquisar modelo, categoria ou tratamento",
  "product.price": "Preço",
  "product.minPrice": "Preço base mínimo",
  "product.maxPrice": "Preço base máximo",
  "product.min": "mín",
  "product.max": "máx",
  "product.clearTable": "Limpar filtros da tabela",
  "product.visible": "{shown} de {total} lentes · {orders} encomendas visíveis",
  "product.sortHint":
    "Clique no título de uma coluna para ordenar · valores em €",
  "product.caption":
    "Catálogo de produtos com métricas de encomendas e custos para os filtros atuais",
  "product.noMatch": "Nenhuma lente corresponde a estes filtros.",
  "product.footer":
    "Catálogo: {count} lentes · As colunas marcadas como “{catalogue}” são preços de tabela, não valores faturados. A contribuição segue as duas interpretações de custo de produção usadas na página Financeira.",
  "product.sortBy": "Ordenar por {label}{hint}",

  "product.column.model": "Modelo",
  "product.column.category": "Categoria",
  "product.column.treatment": "Tratamento",
  "product.column.complexity": "Complexidade",
  "product.column.basePrice": "Preço base",
  "product.column.baseCost": "Custo base",
  "product.column.margin": "Margem",
  "product.column.orders": "Encomendas",
  "product.column.lenses": "Lentes",
  "product.column.incidents": "Incidentes",
  "product.column.revenue": "Receita",
  "product.column.contributionOrder": "Contrib. / encomenda",
  "product.column.contributionLens": "Contrib. / lente",
  "product.hint.catalogue": "catálogo",
  "product.hint.delivered": "entregues",
  "product.hint.shareOrders": "parte das encomendas",

  "simulator.title": "Simulador: testar alavancas de lucro",
  "simulator.decisionNoOrders":
    "Sem encomendas entregues nesta seleção. Mude a loja ou o ano para testar um cenário.",
  "simulator.decisionNoRanges":
    "Adicione um intervalo para modelar uma alteração. Os filtros atuais aplicam-se a todas as alavancas.",
  "simulator.decisionRanges":
    "Lucro projetado de {profit} após {count} {rangeWord}. Maior fator: {driver}.",
  "simulator.statCurrent": "lucro com os filtros atuais",
  "simulator.statChange": "alteração dos intervalos",
  "simulator.statProjected": "lucro projetado",
  "simulator.currentNote": "{orders} encomendas entregues · custo {basis}",
  "simulator.vsCurrent": "{pct} vs atual",
  "simulator.rangeOne": "intervalo",
  "simulator.rangeMany": "intervalos",
  "simulator.activeRanges": "{count} {rangeWord} ativos",
  "simulator.cardAdjust": "Ajustar os intervalos",
  "simulator.intro":
    "Escreva um número ou arraste o cursor. Cada intervalo altera um fator.",
  "simulator.driver": "Fator",
  "simulator.amount": "Valor",
  "simulator.cap": "Limitado a {cap}% para este fator.",
  "simulator.noRanges":
    "Ainda sem intervalos. Adicione um para começar a testar cenários.",
  "simulator.addRange": "Adicionar intervalo",
  "simulator.removeRange": "Remover intervalo de {label}",
  "simulator.percentage": "Percentagem de {label}",
  "simulator.disclaimer":
    "Cálculo de cenário sobre o histórico de 2024–2025, não uma previsão. Cada fator está limitado a 100% mesmo com vários intervalos.",
  "simulator.cardCompare": "Atual vs projetado",
  "simulator.noDelivered":
    "Sem encomendas entregues — ajuste os filtros de loja ou ano.",
  "simulator.chartAria":
    "Lucro atual e projetado após os intervalos selecionados",
  "simulator.cardBreakdown": "Detalhe dos intervalos",
  "simulator.breakdownEmpty":
    "Adicione um intervalo para ver quanto cada alavanca move o lucro.",
  "simulator.target.value": "Valor da encomenda",
  "simulator.target.production": "Custo de produção",
  "simulator.target.logistics": "Custo de logística",
  "simulator.target.incidents": "Custo de incidentes",
  "simulator.target.delivery": "Encomendas entregues",
  "simulator.option.value": "Valor da encomenda (+%)",
  "simulator.option.production": "Custo de produção (−%)",
  "simulator.option.logistics": "Custo de logística (−%)",
  "simulator.option.incidents": "Custo de incidentes (−%)",
  "simulator.option.delivery": "Encomendas entregues (+%)",
  "simulator.hint.value":
    "Preços mais altos acrescentam o aumento total ao lucro.",
  "simulator.hint.production":
    "Menor custo de produção acrescenta a poupança ao lucro.",
  "simulator.hint.logistics":
    "Menor custo de logística acrescenta a poupança ao lucro.",
  "simulator.hint.incidents":
    "Menos incidentes ou incidentes mais baratos acrescentam a poupança ao lucro.",
  "simulator.hint.delivery":
    "Encomendas extra ganham o lucro atual por encomenda entregue.",
  "simulator.target.profit": "Lucro após todos os custos",
  "simulator.option.profit": "Lucro após custos (+%)",
  "simulator.hint.profit":
    "Aumenta o lucro líquido após produção, incidentes e entrega.",

  "dm.title": "Auxiliar de decisão",
  "dm.subtitle": "Onde agir primeiro para a ótica e os modelos selecionados",
  "dm.optician": "Ótica",
  "dm.model": "Modelo",
  "dm.basis": "Custo de produção aplicado",
  "dm.modelAll": "Todos os modelos",
  "dm.modelGroup0": "Progressiva L001–L012",
  "dm.modelGroup1": "L013–L020",
  "dm.modelGroup2": "Outros modelos",
  "dm.allShops": "todas as lojas",
  "dm.noData":
    "Sem encomendas entregues nesta seleção. Mude a ótica ou o modelo.",
  "dm.alertTitle": "Onde agir primeiro?",
  "dm.alertIncidents":
    "Investigue os incidentes que apagaram {share} do valor das encomendas em {models} em {shop} — cerca de {amount} em {orders} entregas.",
  "dm.alertMargin":
    "Confirme a base do custo de produção antes de alterar preços de {models} em {shop}.",
  "dm.alertService":
    "O serviço está estável em {shop}; continue a vigiar {models} por novos incidentes.",
  "dm.colIndicator": "Indicador",
  "dm.colValue": "Valor histórico",
  "dm.colAction": "Passo sugerido",
  "dm.indicatorIncidents": "Margem perdida em incidentes",
  "dm.indicatorMargin": "Margem antes dos incidentes",
  "dm.indicatorSatisfaction": "Satisfação da ótica",
  "dm.incidentsNote": "{amount} em custos de incidentes · {orders} entregas",
  "dm.marginNote": "Após incidentes: {margin}",
  "dm.satisfactionNote": "{count} avaliações da loja · {shop}",
  "dm.actionIncidents":
    "Reveja as causas dos incidentes em {models} em {shop}.",
  "dm.actionMargin": "Confirme com a produção que o custo é {basis}.",
  "dm.actionSatisfaction": "Reveja as categorias de feedback com {shop}.",
  "dm.meaningTitle": "O que significam estes números",
  "dm.meaningIncidents":
    "A margem perdida em incidentes é o custo dos incidentes dividido pelo valor das encomendas nesta seleção.",
  "dm.meaningMargin":
    "A margem antes dos incidentes é (valor da encomenda − produção − logística) ÷ valor da encomenda. O custo dos incidentes está excluído aqui e aparece na primeira linha.",
  "dm.meaningSatisfaction":
    "A satisfação é a média das avaliações no ficheiro de feedback para a ótica selecionada. As avaliações não estão ligadas de forma fiável a encomendas ou modelos, pelo que o filtro de modelo não altera este valor.",
  "dm.actionsTitle": "Como agir sobre isto",
  "dm.actionsBody":
    "1. Confirme com a produção se o custo é por encomenda ou por lente. 2. Reveja as causas dos incidentes no grupo de modelos com mais peso antes de mudar preços. 3. Verifique na página de Finanças as encomendas de baixo preço que dão prejuízo. 4. Corrija as ligações e datas do feedback antes de atribuir satisfação a um modelo.",
  "dm.problemsTitle": "Problemas encontrados nesta seleção",
  "dm.noProblem":
    "Não aparece um problema dominante nesta seleção. Continue a vigiar os indicadores acima.",
  "dm.problemCity": "Em {shop}, o maior fator de incidentes é {cause}.",
  "dm.problemModel":
    "Para {models} em {shop}, o maior fator de incidentes é {cause}.",
  "dm.problemCauseDetail":
    "{count} incidentes ligados · {cost} em custo de incidentes · {share} do custo neste âmbito.",
  "dm.problemLowPrice":
    "Encomendas de baixo preço dão prejuízo em {share} dos casos ({neg} de {low}).",
  "dm.problemLowPriceDetail":
    "O preço não cobre produção e logística, pelo que reduzem a contribuição mesmo quando entregues.",
  "dm.problemSatisfaction":
    "A satisfação em {shop} é de {score}/5, abaixo da referência de 4,2.",
  "dm.problemSatisfactionDetail":
    "Com base em {count} avaliações da loja; o feedback não está ligado a modelos.",
  "dm.actionsIntro": "Uma ação por problema acima, pela mesma ordem:",
  "dm.typeAdjustment": "ajuste",
  "dm.typeRework": "retrabalho",
  "dm.typeReturn": "devolução",
  "dm.typeReplacement": "substituição",
  "dm.motiveUnspecified": "sem motivo registado",
  "dm.motiveWrongGraduation": "graduação errada",
  "dm.motiveScratchedLens": "lente riscada",
  "dm.motiveMounting": "montagem",
  "dm.motiveDiscomfort": "desconforto",
  "dm.motiveDamage": "avaria",
  "dm.motiveUnevenTint": "tinte desigual",
  "dm.fixWrongGraduation":
    "Confirme a graduação e o ajuste final de {models} em {shop}; verifique algumas encomendas antes de alterar preços.",
  "dm.fixScratchedLens":
    "Inspecione o armazenamento e manuseamento de {models} em {shop} e substitua o stock danificado antes da entrega.",
  "dm.fixMounting":
    "Audite a montagem de {models} em {shop} com a equipa de ajuste e registe cada verificação.",
  "dm.fixDiscomfort":
    "Acrescente uma verificação de conforto ao ajuste de {models} em {shop} e acompanhe os casos reportados.",
  "dm.fixDamage":
    "Reveja embalagem e transporte de {models} em {shop} e registe avarias por lote.",
  "dm.fixUnevenTint":
    "Verifique a qualidade do lote de tintura de {models} em {shop} e suspenda lotes duvidosos.",
  "dm.fixUnspecified":
    "Registe o motivo dos incidentes em {models} em {shop} para que a próxima análise possa mirar uma causa.",
  "dm.fixAdjustment":
    "Reveja os pedidos de ajuste de {models} em {shop} e reforce a verificação final.",
  "dm.fixRework":
    "Identifique as etapas de retrabalho de {models} em {shop} e elimine o defeito repetido antes de aceitar mais encomendas.",
  "dm.fixReturn":
    "Analise os motivos de devolução de {models} em {shop} e confirme a especificação da encomenda antes do envio.",
  "dm.fixReplacement":
    "Verifique o stock de substituição e a exatidão da encomenda de {models} em {shop} antes do envio.",
  "dm.fixLowPrice":
    "Defina um preço mínimo para {models} em {shop} e analise as encomendas sinalizadas na página de Finanças.",
  "dm.fixSatisfaction":
    "Reveja as categorias de feedback com a {shop} e resolva as queixas em aberto antes de campanhas.",
  "dm.fixNone":
    "Continue a monitorizar {models} em {shop} e repita esta análise se o custo dos incidentes subir.",

  "finance.inspectFilters": "Filtros da lista de encomendas",

  "value.progressiva": "Progressiva",
  "value.unifocal": "Unifocal",
  "value.bifocal": "Bifocal",
  "value.fotocromatica": "Fotocrómica",
  "value.tratamento_especial": "Tratamento especial",
  "value.standard": "Padrão",
  "value.uv": "UV",
  "value.anti_reflexo": "Antirreflexo",
  "value.premium_multicamada": "Multicamada premium",
  "value.blue_cut": "Corte de luz azul",
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  /** Translate a catalogue category or treatment value. */
  tv: (raw: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const htmlLang = (locale: Locale) => (locale === "pt" ? "pt-PT" : "en");

const PAGE_TITLE_KEYS: Record<string, TranslationKey> = {
  "/": "production.title",
  "/finance": "finance.title",
  "/product": "product.title",
  "/simulator": "simulator.title",
};

const hasKey = (key: string): key is TranslationKey => key in en;

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next: Locale = saved === "pt" ? "pt" : "en";
    setLocaleState(next);
    document.documentElement.lang = htmlLang(next);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.lang = htmlLang(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: TranslationVars) => {
      const template = (locale === "pt" ? pt : en)[key];
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(vars[name] ?? ""),
      );
    },
    [locale],
  );

  const tv = useCallback(
    (raw: string) => {
      const key = `value.${raw}`;
      return hasKey(key) ? t(key) : raw;
    },
    [t],
  );

  useEffect(() => {
    document.documentElement.lang = htmlLang(locale);
    const title = `${t(PAGE_TITLE_KEYS[pathname] ?? "nav.home")} · Opticmizer`;
    const descriptionText = t("meta.description");

    const apply = () => {
      if (document.title !== title) document.title = title;
      const description = document.querySelector<HTMLMetaElement>(
        'meta[name="description"]',
      );
      if (description && description.content !== descriptionText) {
        description.content = descriptionText;
      }
    };

    apply();

    // Next.js re-applies its static page metadata after hydration, which would
    // otherwise overwrite the translated title. Keep client locale authoritative.
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [locale, pathname, t]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tv }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
