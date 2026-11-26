import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import { FilterBar } from "@/components/filter-bar";
import { SiteNav } from "@/components/site-nav";
import { FiltersProvider } from "@/lib/filters";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Opticmizer", template: "%s · Opticmizer" },
  description:
    "Decision support for a 12-shop lens network: quality, finance, product and scenario simulation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <FiltersProvider>
          <I18nProvider>
            <SiteNav />
            <FilterBar />
            <main className="flex flex-1 flex-col lg:min-h-0 lg:overflow-y-auto">
              {children}
            </main>
          </I18nProvider>
        </FiltersProvider>
      </body>
    </html>
  );
}
