import PropTypes from "prop-types";
import Button from "@shared/components/ui/Button";
import styles from "./CookieConsent.module.css";

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

export default CookieConsentBanner;
