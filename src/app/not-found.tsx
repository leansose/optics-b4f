"use client";
import { Aperture, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { locale } = useI18n();
  const pt = locale === "pt";
  return (
    <section className="mx-auto grid min-h-[65vh] max-w-3xl content-center justify-items-start gap-5 px-6 py-16">
      <div
        role="img"
        aria-label="404"
        className="flex items-center gap-1 font-display text-7xl font-bold leading-none text-green"
      >
        <span aria-hidden="true">4</span>
        <Aperture
          className="size-[0.78em]"
          strokeWidth={1.4}
          aria-hidden="true"
        />
        <span aria-hidden="true">4</span>
      </div>
      <h1>{pt ? "Página não encontrada" : "Page not found"}</h1>
      <p className="max-w-prose text-muted">
        {pt
          ? "Verifique o endereço ou volte à visão geral para continuar a explorar os dados da rede."
          : "Check the address or return to the overview to explore the network data."}
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-switch-active px-4 py-2 font-semibold text-on-accent"
      >
        <ArrowLeft size={17} />
        {pt ? "Voltar à visão geral" : "Back to overview"}
      </Link>
    </section>
  );
}
