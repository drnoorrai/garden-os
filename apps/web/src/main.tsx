import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { GardenProvider } from "./lib/GardenProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <GardenProvider>
        <App />
      </GardenProvider>
    </BrowserRouter>
  </StrictMode>,
);
