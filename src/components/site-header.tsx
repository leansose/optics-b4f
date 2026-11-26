"use client";
import { Glasses, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/hooks/use-preferences";
export function SiteHeader() {
  const pathname = usePathname();
  const { language, setLanguage, theme, setTheme } = usePreferences();
  const t = (pt: string, en: string) => (language === "pt" ? pt : en);
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto w-full max-w-[1170px] px-4 md:px-10 grid items-center justify-between gap-2 py-3 md:flex md:min-h-[70px]">
        <Link className="flex items-center gap-2 text-xl font-bold tracking-tight [&_svg]:text-green" href="/">
          <Glasses size={31} /> Opticmizer
        </Link>
        <nav className="col-span-2 row-start-2 flex flex-wrap items-center gap-4 text-sm font-semibold md:gap-7 [&_a]:py-2 [&_a[aria-current=page]]:border-b-2 [&_a[aria-current=page]]:text-green" aria-label={t("Navegação principal", "Main navigation")}>
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            {t("Comparação", "Comparison")}
          </Link>
          <Link
            href="/simulador"
            aria-current={pathname === "/simulador" ? "page" : undefined}
          >
            {t("Simulador", "Simulator")}
          </Link>
          <Link
            href="/qualidade"
            aria-current={pathname === "/qualidade" ? "page" : undefined}
          >
            {t("Qualidade dos dados", "Data quality")}
          </Link>
        </nav>
        <div className="col-start-2 row-start-1 flex items-center gap-2 max-md:[&_span]:hidden">
          <button
            type="button"
            onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
            aria-label={t(
              "Mudar idioma para inglês",
              "Switch language to Portuguese",
            )}
          >
            {language === "pt" ? "PT / EN" : "EN / PT"}
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={
              theme === "light"
                ? t("Ativar tema escuro", "Activate dark theme")
                : t("Ativar tema claro", "Activate light theme")
            }
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            <span>
              {theme === "light" ? t("Escuro", "Dark") : t("Claro", "Light")}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
