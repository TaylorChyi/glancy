import { Suspense } from "react";
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
} from "@/context";

function AppProviders({ children }) {
  return (
    <AppProvider>
      <ApiProvider>
        <LanguageProvider>
          <ThemeProvider>
            <CookieConsent />
            <AuthWatcher />
            <ErrorBoundary>
              <Suspense fallback={<Loader />}>{children}</Suspense>
            </ErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </ApiProvider>
    </AppProvider>
  );
}

AppProviders.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProviders;
