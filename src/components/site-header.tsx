"use client";

import {
  Aperture,
  ChartNoAxesCombined,
  ChartPie,
  Glasses,
  Layers,
  Menu,
  Moon,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  useDocumentPreferences,
  usePreferences,
} from "@/hooks/use-preferences";

const pages = [
  ["/", "Visão geral", "Overview", ChartNoAxesCombined],
  ["/finance", "Finanças", "Finance", ChartPie],
  ["/product", "Catálogo", "Catalogue", Layers],
  ["/comparacao", "Óticas", "Opticians", Glasses],
  ["/simulador", "Simulador", "Simulator", SlidersHorizontal],
  ["/qualidade", "Qualidade dos dados", "Data quality", ShieldCheck],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useDocumentPreferences();
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize } =
    usePreferences();
  const pt = language === "pt";
  const fontLabel = pt ? "Tamanho do texto" : "Text size";
  const themeLabel =
    theme === "light"
      ? pt
        ? "Ativar tema escuro"
        : "Activate dark theme"
      : pt
        ? "Ativar tema claro"
        : "Activate light theme";
  const control =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted hover:bg-panel hover:text-green";
  return (
    <header className="border-b border-line bg-surface">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-surface p-3 focus:not-sr-only focus:absolute"
      >
        {pt ? "Saltar para o conteúdo" : "Skip to content"}
      </a>
      <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-x-1 px-3 py-2 sm:px-7 xl:px-12">
        <Link
          href="/"
          aria-label="Opticmizer"
          className="flex min-h-12 items-center gap-1.5 font-display text-lg sm:text-2xl font-bold tracking-tight"
        >
          <span className="hidden size-9 sm:grid place-items-center rounded-xl bg-switch-active text-on-accent">
            <Aperture size={25} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <span>
            Optic<span className="text-green">mizer</span>
          </span>
        </Link>
        <nav
          aria-label={pt ? "Navegação principal" : "Main navigation"}
          id="site-nav"
          className={
            (open ? "block " : "hidden ") +
            "order-last w-full sm:block xl:order-none xl:w-auto"
          }
        >
          <ul className="flex flex-wrap gap-x-1 sm:gap-x-2">
            {pages.map(([href, name, en, Icon]) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <li key={href}>
                  <Link
                    onClick={() => setOpen(false)}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold transition-colors ${active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-panel hover:text-ink"}`}
                  >
                    <Icon
                      className="size-4 shrink-0"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                    {pt ? name : en}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            className={control}
            aria-label={
              pt ? "Mudar idioma para inglês" : "Switch language to Portuguese"
            }
            onClick={() => setLanguage(pt ? "en" : "pt")}
          >
            <span className={pt ? "text-ink" : ""}>PT</span>
            <span aria-hidden="true" className="text-control-border">
              /
            </span>
            <span className={!pt ? "text-ink" : ""}>EN</span>
          </button>
          <label className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm font-semibold text-muted hover:bg-panel">
            <span aria-hidden="true">
              A<span className="align-super text-xs">+</span>
            </span>
            <select
              aria-label={fontLabel}
              title={fontLabel}
              value={fontSize}
              onChange={(e) =>
                setFontSize(Number(e.target.value) as 100 | 115 | 130)
              }
              className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
            >
              {[100, 115, 130].map((size) => (
                <option key={size} value={size}>
                  {fontLabel} · {size}%
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={control}
            title={themeLabel}
            aria-label={themeLabel}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            type="button"
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-lg text-muted sm:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen(!open)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
