import { SimulatorPage } from "@/components/simulator-page";
import { loadNetwork } from "@/services/data";
export const metadata = { title: "Simulador de contribuição | Opticmizer" };
export default async function Page() {
  return <SimulatorPage data={await loadNetwork()} />;
}
