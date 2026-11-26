import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { FiltersProvider } from "@/lib/filters";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Opticmizer", template: "%s · Opticmizer" },
  description:
    "Produção, finanças e qualidade das encomendas de uma rede de óticas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT">
      <body>
        <I18nProvider>
          <FiltersProvider>
            <SiteHeader />
            <main id="conteudo" tabIndex={-1}>
              {children}
            </main>
          </FiltersProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
