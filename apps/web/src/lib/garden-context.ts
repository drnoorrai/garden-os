import type { GardenData } from "@garden/types";
import { createContext, useContext } from "react";

export interface GardenContextValue {
  data: GardenData;
  update: (recipe: (current: GardenData) => GardenData) => void;
  reset: () => Promise<void>;
  ready: boolean;
}

export const GardenContext = createContext<GardenContextValue | null>(null);

export const useGarden = () => {
  const value = useContext(GardenContext);
  if (!value) throw new Error("useGarden must be used inside GardenProvider");
  return value;
};
