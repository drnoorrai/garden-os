import { useAuth } from "@garden/auth";
import { GardenProvider } from "@garden/shared-state";
import { supabaseAdapter } from "@garden/storage";
import type { GardenData } from "@garden/types";
import { useMemo } from "react";
import { App } from "./App";

export const GardenRoot = () => {
  const auth = useAuth();
  const remoteAdapter = useMemo(
    () => auth.client && auth.user
      ? supabaseAdapter<Partial<GardenData>>({ client: auth.client, userId: auth.user.id })
      : null,
    [auth.client, auth.user],
  );
  const storageKey = auth.enabled
    ? auth.user ? `garden-os:v1:user:${auth.user.id}` : "garden-os:v1:anonymous"
    : "garden-os:v1:local";
  const fallbackStorageKeys = auth.user ? ["garden-os:v1:local", "garden-os:v1"] : [];

  return (
    <GardenProvider
      key={storageKey}
      fallbackStorageKeys={fallbackStorageKeys}
      remoteAdapter={remoteAdapter}
      storageKey={storageKey}
    >
      <App />
    </GardenProvider>
  );
};
