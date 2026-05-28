import { useAuth } from "@garden/auth";
import { GardenProvider } from "@garden/shared-state";
import { App } from "./App";

export const GardenRoot = () => {
  const auth = useAuth();
  const storageKey = auth.enabled
    ? auth.user ? `garden-os:v1:user:${auth.user.id}` : "garden-os:v1:anonymous"
    : "garden-os:v1:local";

  return (
    <GardenProvider key={storageKey} storageKey={storageKey}>
      <App />
    </GardenProvider>
  );
};
