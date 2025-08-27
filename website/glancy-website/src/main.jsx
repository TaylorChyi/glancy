/* eslint-env browser */

import { StrictMode, Suspense, lazy, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import "./styles/index.css";
import Loader from "./components/ui/Loader";
import AuthWatcher from "./components/AuthWatcher";
import { rafThrottle } from "./utils/rafThrottle";

const App = lazy(() => import("./pages/App"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
import {
  ApiProvider,
  LanguageProvider,
  ThemeProvider,
  AppProviders,
} from "@/context";

function ViewportHeightUpdater() {
  useLayoutEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight}px`,
      );
    };
    const handleResize = rafThrottle(setVh);
    setVh();
    window.addEventListener("resize", handleResize);
    return () => {
      handleResize.cancel();
      window.removeEventListener("resize", handleResize);
    };
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
