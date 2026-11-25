import { create } from "zustand";
import type { Scenario } from "@/types";

const initial: Scenario = {
  shop: "all",
  lens: "priority",
  unit: false,
  reduction: 10,
  productionChange: 0,
  priceChange: 0,
};
export const useScenario = create<
  Scenario & { change: (values: Partial<Scenario>) => void; reset: () => void }
>((set) => ({
  ...initial,
  change: (values) => set(values),
  reset: () => set(initial),
}));
