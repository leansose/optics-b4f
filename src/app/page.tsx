import { Dashboard } from "@/components/dashboard";
import { loadNetwork } from "@/services/data";
export default async function Page() {
  return <Dashboard data={await loadNetwork()} />;
}
