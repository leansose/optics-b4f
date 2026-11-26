export interface Order {
  id: string;
  id_encomenda: string;
  id_otica: string;
  id_lente: string;
  quantidade: number;
  estado: string;
  valor_total: number;
  data_entrega_real: string | null;
  data_entrega_prevista: string;
}
export interface Incident {
  id: string;
  id_encomenda: string;
  id_lente: string;
  id_otica: string;
  custo_estimado: number;
  tipo_ocorrencia: string;
  resolucao_normalizada: string | null;
  motivo: string | null;
}
export interface Feedback {
  id_otica: string;
  id_encomenda: string | null;
  data: string;
  categoria_feedback: string;
  satisfacao_geral: number;
}
export interface Shop {
  id: string;
  cidade: string;
}
export interface Lens {
  id: string;
  categoria: string;
  custo_base_estimado: number;
  complexidade: number;
}
export interface Production {
  id_encomenda: string;
  custo_real: number;
  operador: string;
}
export interface Shipping {
  id_encomenda: string;
  custo: number;
}
export interface Totals {
  pendingAdjustments: number;
  catalogCost: number;
  orders: number;
  affected: number;
  delivered: number;
  delayed: number;
  sales: number;
  production: number;
  perLens: number;
  shipping: number;
  incidentCost: number;
  deliveredIncidentCost: number;
}
export interface Segment {
  shop: string;
  lens: string;
  totals: Totals;
}
export interface OrderExample {
  shop: string;
  lens: string;
  adjustmentOnly?: boolean;
  recordId?: string;
  code: string;
  quantity: number;
  sales: number;
  production: number;
  shipping: number;
  incident: number;
}
export interface Network {
  reviews: {
    shop: string;
    lens: string;
    count: number;
    score: number;
    lowThemes: Record<string, number>;
  }[];
  shops: Shop[];
  lenses: Lens[];
  segments: Segment[];
  orphans: Incident[];
  duplicates: number;
  convertedDates: number;
  example: OrderExample | null;
  orderDetails: OrderExample[];
  reasons: { name: string; count: number }[];
  operatorRates: { operator: string; total: number; affected: number }[];
}
export interface Scenario {
  shop: string;
  lens: string;
  unit: boolean;
  reduction: number;
  productionChange: number;
  priceChange: number;
}
