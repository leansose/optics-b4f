import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
