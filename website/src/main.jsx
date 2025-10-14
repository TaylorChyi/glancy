import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppProviders from "@app/providers/AppProviders";
import ViewportHeightUpdater from "@shared/components/system/ViewportHeightUpdater";
import AppRouter from "@app/navigation/AppRouter";
import registerServiceWorker from "@shared/utils/registerServiceWorker";
import "./index.css";

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
