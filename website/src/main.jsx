import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppProviders from "@/components/providers/AppProviders";
import ViewportHeightUpdater from "@/components/system/ViewportHeightUpdater";
import AppRouter from "@/routes/AppRouter";
import registerServiceWorker from "@/utils/registerServiceWorker";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ViewportHeightUpdater />
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
);

registerServiceWorker();
