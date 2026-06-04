import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@garden/auth";
import { GardenRoot } from "./GardenRoot";
import "./index.css";

const authConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  redirectTo: `${window.location.origin}/work`,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider config={authConfig}>
        <GardenRoot />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
