import { useEffect } from "react";
import { useCookieConsentStore } from "@core/store";

function useCookieConsentBanner() {
  const status = useCookieConsentStore((state) => state.status);
  const promptVisible = useCookieConsentStore((state) => state.promptVisible);
  const promptContext = useCookieConsentStore((state) => state.promptContext);
  const setPromptVisible = useCookieConsentStore(
    (state) => state.setPromptVisible,
  );
  const acceptCookies = useCookieConsentStore((state) => state.acceptCookies);
  const rejectCookies = useCookieConsentStore((state) => state.rejectCookies);
  const synchronizeLoginCookie = useCookieConsentStore(
    (state) => state.synchronizeLoginCookie,
  );

  useEffect(() => {
    if (status === "accepted") {
      synchronizeLoginCookie();
      return;
    }
    if (status === "unknown" && !promptVisible) {
      setPromptVisible(true, "initial");
    }
  }, [status, promptVisible, setPromptVisible, synchronizeLoginCookie]);

  return {
    isVisible: promptVisible,
    promptContext,
    acceptCookies,
    rejectCookies,
  };
}

export default useCookieConsentBanner;
