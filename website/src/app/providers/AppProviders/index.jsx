import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import ErrorBoundary from "@shared/components/ui/ErrorBoundary";
import Loader from "@shared/components/ui/Loader";
import AuthWatcher from "@shared/components/AuthWatcher";
import CookieConsent from "@shared/components/CookieConsent";
import {
  LanguageProvider,
  ThemeProvider,
  AppProvider,
  ApiProvider,
  KeyboardShortcutProvider,
} from "@core/context";

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
