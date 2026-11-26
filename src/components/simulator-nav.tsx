"use client";
import { Combine, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function SimulatorNav() {
  const path = usePathname();
  const pt = useI18n().locale === "pt";
  return (
    <nav
      aria-label={pt ? "Análises do simulador" : "Simulator analyses"}
      className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line"
    >
      {[
        {
          url: "/simulador",
          title: pt ? "Cenário combinado" : "Combined scenario",
          Icon: Combine,
        },
        {
          url: "/simulador/encomendas",
          title: pt
            ? "Encomendas e ponto de equilíbrio"
            : "Orders and break-even",
          Icon: Search,
        },
      ].map(({ url, title, Icon }) => (
        <Link
          key={url}
          href={url}
          aria-current={url === path ? "page" : undefined}
          className={`inline-flex min-h-11 items-center gap-2 border-b-2 py-2 text-sm font-semibold ${url === path ? "border-green text-green" : "border-transparent text-muted hover:text-ink"}`}
        >
          <Icon className="size-4" aria-hidden="true" />
          {title}
        </Link>
      ))}
    </nav>
  );
}
