"use client";
import { useAnalysis } from "@/hooks/use-analysis";
import { usePreferences } from "@/hooks/use-preferences";
import type { Network } from "@/types";
import { Simulator } from "./simulator";
export function SimulatorPage({ data }: { data: Network }) {
  const { language } = usePreferences();
  const { scenario, result } = useAnalysis(data);
  return (
    <main className="mx-auto w-full max-w-[1170px] px-4 md:px-10">
      <h1 className="mt-10 mb-5">
        {language === "pt"
          ? "Simulador de contribuição"
          : "Contribution simulator"}
      </h1>
      <Simulator
        data={data}
        language={language}
        scenario={scenario}
        result={result}
      />
    </main>
  );
}
