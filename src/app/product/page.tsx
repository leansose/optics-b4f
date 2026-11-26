import type { Metadata } from "next";
import { ProductDashboard } from "@/components/dashboards/product-dashboard";

export const metadata: Metadata = { title: "Product" };

export default function ProductPage() {
  return <ProductDashboard />;
}
