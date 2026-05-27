import { createSeedData, todayKey } from "@garden/domain";
import { localStorageAdapter } from "@garden/storage";
import type { GardenData } from "@garden/types";
import { type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { GardenContext, type GardenContextValue } from "./garden-context";

const STORAGE_KEY = "garden-os:v1";
const adapter = localStorageAdapter<GardenData>(STORAGE_KEY);

export const GardenProvider = ({ children }: PropsWithChildren) => {
  const [data, setData] = useState<GardenData>(() => createSeedData(todayKey()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void adapter.load().then((saved) => {
      if (saved) setData(saved);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) void adapter.save(data);
  }, [data, ready]);

  const value = useMemo<GardenContextValue>(
    () => ({
      data,
      ready,
      update: (recipe) => setData((current) => recipe(current)),
      reset: async () => {
        await adapter.clear();
        setData(createSeedData(todayKey()));
      },
    }),
    [data, ready],
  );

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
};
