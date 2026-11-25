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
  motivo: string | null;
}
export interface Shop {
  id: string;
  cidade: string;
}
export interface Lens {
  id: string;
  categoria: string;
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
  recordId?: string;
  code: string;
  quantity: number;
  sales: number;
  production: number;
  shipping: number;
  incident: number;
}
export interface Network {
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
