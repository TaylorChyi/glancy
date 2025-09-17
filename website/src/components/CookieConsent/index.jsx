import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/context";
import { useCookieConsentStore } from "@/store";
import styles from "./CookieConsent.module.css";

function CookieConsent() {
  const { t } = useLanguage();
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

  if (!promptVisible) {
    return null;
  }

  const description =
    promptContext === "required"
      ? t.cookieConsentRequired
      : t.cookieConsentDescription;

  return (
    <div className={styles.wrapper} role="dialog" aria-live="polite">
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.title}>{t.cookieConsentTitle}</div>
          <div className={styles.description}>{description}</div>
          <div className={styles.notice}>{t.cookieConsentNotice}</div>
        </div>
        <div className={styles.actions}>
          <Button
            className={styles.primary}
            onClick={() => {
              acceptCookies();
            }}
          >
            {t.cookieConsentAccept}
          </Button>
          <Button
            className={styles.secondary}
            onClick={() => {
              rejectCookies();
            }}
          >
            {t.cookieConsentDecline}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
