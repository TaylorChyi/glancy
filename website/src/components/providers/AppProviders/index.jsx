import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import Loader from "@/components/ui/Loader";
import AuthWatcher from "@/components/AuthWatcher";
import CookieConsent from "@/components/CookieConsent";
import {
  LanguageProvider,
  ThemeProvider,
  AppProvider,
  ApiProvider,
  KeyboardShortcutProvider,
} from "@/context";

function AppProviders({ children }) {
  const location = useLocation();

  return (
    <AppProvider>
      <ApiProvider>
        <KeyboardShortcutProvider>
          <LanguageProvider>
            <ThemeProvider>
              <CookieConsent />
              <AuthWatcher />
              <ErrorBoundary resetKeys={[location.key]}>
                <Suspense fallback={<Loader />}>{children}</Suspense>
              </ErrorBoundary>
            </ThemeProvider>
          </LanguageProvider>
        </KeyboardShortcutProvider>
      </ApiProvider>
    </AppProvider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProviders;
