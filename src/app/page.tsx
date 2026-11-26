import { Dashboard } from "@/components/dashboard";
import { loadNetwork } from "@/services/data";
export default async function Page() {
  const data = await loadNetwork();
  return <Dashboard data={{ ...data, orderDetails: [], orphans: [] }} />;
}
