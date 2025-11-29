import { createContext, useContext, useState, ReactNode } from "react";
import { RouteData } from "./api/client";

type RouteSelection = {
  route: RouteData | null;
  setRoute: (route: RouteData) => void;
  clear: () => void;
};

const RouteSelectionContext = createContext<RouteSelection | undefined>(undefined);

export function RouteSelectionProvider({ children }: { children: ReactNode }) {
  const [route, setRouteState] = useState<RouteData | null>(null);

  const value: RouteSelection = {
    route,
    setRoute: (r) => setRouteState(r),
    clear: () => setRouteState(null),
  };

  return <RouteSelectionContext.Provider value={value}>{children}</RouteSelectionContext.Provider>;
}

export function useRouteSelection() {
  const ctx = useContext(RouteSelectionContext);
  if (!ctx) throw new Error("useRouteSelection must be used within RouteSelectionProvider");
  return ctx;
}
