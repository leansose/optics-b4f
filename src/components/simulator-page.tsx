"use client";
import { useAnalysis } from "@/hooks/use-analysis";
import { usePreferences } from "@/hooks/use-preferences";
import type { Network } from "@/types";
import { PageShell } from "./page-shell";
import { Simulator } from "./simulator";
import { SimulatorNav } from "./simulator-nav";
export function SimulatorPage({ data }: { data: Network }) {
  const { language } = usePreferences();
  const { scenario, result } = useAnalysis(data);
  const pt = language === "pt";
  return (
    <PageShell
      title={pt ? "Simulador de contribuição" : "Contribution simulator"}
      intro={
        pt
          ? "Investigue as entregas que passaram a ter contribuição negativa e teste alterações de preço e custo a volume constante."
          : "Inspect deliveries that crossed below break-even and test price and cost changes at constant volume."
      }
      filters={false}
      navigation={<SimulatorNav />}
    >
      <div className="legacy">
        <Simulator
          data={data}
          language={language}
          scenario={scenario}
          result={result}
        />
      </div>
    </PageShell>
  );
}
