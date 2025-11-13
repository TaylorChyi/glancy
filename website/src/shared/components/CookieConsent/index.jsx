import { useEffect } from "react";
import PropTypes from "prop-types";
import Button from "@shared/components/ui/Button";
import { useLanguage } from "@core/context";
import { useCookieConsentStore } from "@core/store";
import styles from "./CookieConsent.module.css";

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

function CookieConsentBanner({
  title,
  description,
  notice,
  onAccept,
  onReject,
  acceptLabel,
  declineLabel,
}) {
  return (
    <div className={styles.wrapper} role="dialog" aria-live="polite">
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          <div className={styles.description}>{description}</div>
          <div className={styles.notice}>{notice}</div>
        </div>
        <div className={styles.actions}>
          <Button className={styles.primary} onClick={onAccept}>
            {acceptLabel}
          </Button>
          <Button className={styles.secondary} onClick={onReject}>
            {declineLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

CookieConsentBanner.propTypes = {
  acceptLabel: PropTypes.string.isRequired,
  declineLabel: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  notice: PropTypes.string.isRequired,
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

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
