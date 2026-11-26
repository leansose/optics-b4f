import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
export const metadata: Metadata = {
  title: "Opticmizer · Decisões sobre lentes",
  description:
    "Comparação de óticas e simulação da contribuição de encomendas de lentes.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
