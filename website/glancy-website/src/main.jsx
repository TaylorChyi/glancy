import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import "./styles/index.css";
import Loader from "./components/ui/Loader";
import AuthWatcher from "./components/AuthWatcher";

const App = lazy(() => import("./pages/App"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
import {
  ApiProvider,
  LanguageProvider,
  ThemeProvider,
  AppProviders,
} from "@/context";

// eslint-disable-next-line react-refresh/only-export-components
function ViewportHeightUpdater() {
  useEffect(() => {
    const updateVh = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight}px`,
      );
    };
    updateVh();
    window.addEventListener("resize", updateVh);
    return () => window.removeEventListener("resize", updateVh);
  }, []);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ViewportHeightUpdater />
    <AppProviders>
      <ApiProvider>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
              <AuthWatcher />
              <ErrorBoundary>
                <Suspense fallback={<Loader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<App />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </ApiProvider>
    </AppProviders>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
