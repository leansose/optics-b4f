import { readFile } from "node:fs/promises";
import path from "node:path";
import { prepareNetwork } from "@/lib/analytics";
import type {
  Feedback,
  Incident,
  Lens,
  Order,
  Production,
  Shipping,
  Shop,
} from "@/types";

async function readJson<T>(file: string): Promise<T> {
  const location = path.join(
    process.cwd(),
    "reports",
    "lentes",
    "dados-limpos",
    `${file}.json`,
  );
  return JSON.parse(await readFile(location, "utf8")) as T;
}
export async function loadNetwork() {
  "use cache";
  const [orders, shops, lenses, production, shipping, events, feedback, audit] =
    await Promise.all([
      readJson<Order[]>("encomendas_lentes"),
      readJson<Shop[]>("oticas_parceiras"),
      readJson<Lens[]>("lentes_catalogo"),
      readJson<Production[]>("producao"),
      readJson<Shipping[]>("custos_logistica"),
      readJson<Incident[]>("retrabalho_devolucoes"),
      readJson<Feedback[]>("feedback_oticas"),
      readJson<{
        encomendas_lentes: {
          duplicados_exatos_removidos: number;
          datas_convertidas: { data_encomenda: number };
        };
      }>("auditoria"),
    ]);
  return prepareNetwork(
    orders,
    shops,
    lenses,
    production,
    shipping,
    events,
    feedback,
    audit.encomendas_lentes.duplicados_exatos_removidos,
    audit.encomendas_lentes.datas_convertidas.data_encomenda,
  );
}
