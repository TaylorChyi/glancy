import { Link } from "react-router-dom";
import Button from "@shared/components/ui/Button";
import MultiLineText from "@shared/components/ui/MultiLineText.jsx";
import ThemeIcon from "@shared/components/ui/Icon";
import ICP from "@shared/components/ui/ICP";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import { BRAND_LOGO_ICON } from "@shared/utils";
import styles from "../AuthForm.module.css";

export function AuthFormHeader({ brandText, title }) {
  return (
    <>
      <ThemeIcon
        name={BRAND_LOGO_ICON}
        alt={brandText}
        className={styles["auth-logo"]}
      />
      <div className={styles["auth-brand"]}>{brandText}</div>
      <MultiLineText as="h1" className={styles["auth-title"]} text={title} />
    </>
  );
}

export function AuthFormSwitch({ switchLink, switchText, t }) {
  const switchLabel = switchLink.includes("login")
    ? t.loginButton
    : t.registerButton;

  return (
    <div className={styles["auth-switch"]}>
      {switchText} <Link to={switchLink}>{switchLabel}</Link>
    </div>
  );
}

export function AuthMethodDivider({ label }) {
  return (
    <div className={styles.divider} role="separator" aria-label={label}>
      <span className={styles["divider-label"]}>{label}</span>
    </div>
  );
}

const resolveIconName = (icons, candidate) => icons[candidate];

const createMethodClickHandler = ({
  availableFormMethods,
  candidate,
  onMethodChange,
  onUnavailableMethod,
}) => () => {
  if (availableFormMethods.includes(candidate)) {
    onMethodChange(candidate);
    return;
  }

  onUnavailableMethod();
};

const renderSwitchOption = ({
  availableFormMethods,
  candidate,
  icons,
  onMethodChange,
  onUnavailableMethod,
}) => {
  const iconName = resolveIconName(icons, candidate);
  const handleClick = createMethodClickHandler({
    availableFormMethods,
    candidate,
    onMethodChange,
    onUnavailableMethod,
  });

  return (
    <Button key={candidate} type="button" onClick={handleClick}>
      <ThemeIcon name={iconName} alt={candidate} />
    </Button>
  );
};

export function AuthMethodSwitcher({
  availableFormMethods,
  icons,
  method,
  onMethodChange,
  onUnavailableMethod,
  orderedMethods,
}) {
  return (
    <div className={styles["login-options"]}>
      {orderedMethods
        .filter((candidate) => candidate !== method)
        .map((candidate) =>
          renderSwitchOption({
            availableFormMethods,
            candidate,
            icons,
            onMethodChange,
            onUnavailableMethod,
          }),
        )}
    </div>
  );
}

export function AuthFormFooter({ t }) {
  return (
    <div className={styles["auth-footer"]}>
      <div className={styles["footer-links"]}>
        <a href="#">{t.termsOfUse}</a> | <a href="#">{t.privacyPolicy}</a>
      </div>
      <ICP />
    </div>
  );
}

export function AuthFeedbackHub({
  popup,
  resetPopup,
  resetToast,
  toast,
  toastDismissLabel,
}) {
  return (
    <FeedbackHub
      popup={{
        open: popup.open,
        message: popup.message,
        onClose: resetPopup,
      }}
      toast={{
        open: toast.open,
        message: toast.message,
        onClose: resetToast,
        closeLabel: toastDismissLabel,
      }}
    />
  );
}
