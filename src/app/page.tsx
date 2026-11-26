import type { Metadata } from "next";
import { ProductionDashboard } from "@/components/dashboards/production-dashboard";

export const metadata: Metadata = { title: "Production" };

export default function ProductionPage() {
  return <ProductionDashboard />;
}
