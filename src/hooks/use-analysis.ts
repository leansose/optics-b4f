import { useMemo } from "react";
import {
  compareShops,
  isPriority,
  simulate,
  sumSegments,
} from "@/lib/analytics";
import { useScenario } from "@/store/scenario";
import type { Network } from "@/types";
export function useAnalysis(data: Network) {
  const scenario = useScenario();
  const overview = useMemo(
    () => ({
      all: sumSegments(data.segments),
      priority: sumSegments(data.segments.filter((s) => isPriority(s.lens))),
      shops: compareShops(data),
    }),
    [data],
  );
  return { ...overview, scenario, result: simulate(data.segments, scenario) };
}
