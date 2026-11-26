import type { Metadata } from "next";
import { SimulatorDashboard } from "@/components/dashboards/simulator-dashboard";

export const metadata: Metadata = { title: "Simulator" };

export default function SimulatorPage() {
  return <SimulatorDashboard />;
}
