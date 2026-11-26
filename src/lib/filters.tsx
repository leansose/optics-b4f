"use client";

import { createContext, type ReactNode, useContext, useState } from "react";
import { type Filters, NO_FILTERS } from "./cube";

type Ctx = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  reset: () => void;
  active: boolean;
};

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setAll] = useState<Filters>(NO_FILTERS);
  const value: Ctx = {
    filters,
    setFilters: (patch) => setAll((f) => ({ ...f, ...patch })),
    reset: () => setAll(NO_FILTERS),
    active:
      filters.shop !== null || filters.year !== null || filters.model !== null,
  };
  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}
