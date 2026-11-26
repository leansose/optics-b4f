import type { Metadata } from "next";
import { FinanceDashboard } from "@/components/dashboards/finance-dashboard";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return <FinanceDashboard />;
}
