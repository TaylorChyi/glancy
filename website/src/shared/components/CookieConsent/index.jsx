import { useLanguage } from "@core/context";
import CookieConsentBanner from "./CookieConsentBanner";
import useCookieConsentBanner from "./useCookieConsentBanner";

function CookieConsent() {
  const { t } = useLanguage();
  const { isVisible, promptContext, acceptCookies, rejectCookies } =
    useCookieConsentBanner();

  if (!isVisible) {
    return null;
  }

  const description =
    promptContext === "required"
      ? t.cookieConsentRequired
      : t.cookieConsentDescription;

  return (
    <CookieConsentBanner
      title={t.cookieConsentTitle}
      description={description}
      notice={t.cookieConsentNotice}
      onAccept={acceptCookies}
      onReject={rejectCookies}
      acceptLabel={t.cookieConsentAccept}
      declineLabel={t.cookieConsentDecline}
    />
  );
}

export default CookieConsent;
