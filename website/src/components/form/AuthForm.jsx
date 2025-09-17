import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CodeButton from "./CodeButton.jsx";
import PhoneInput from "./PhoneInput.jsx";
import Button from "@/components/ui/Button";
import MultiLineText from "@/components/ui/MultiLineText.jsx";
import styles from "./AuthForm.module.css";
import MessagePopup from "@/components/ui/MessagePopup";
import ThemeIcon from "@/components/ui/Icon";
import ICP from "@/components/ui/ICP";
import PasswordInput from "@/components/ui/PasswordInput";
import { useLanguage } from "@/context";
import { getBrandText } from "@/utils";

const USERNAME_METHOD = "username";

const defaultIcons = {
  username: "user",
  email: "email",
  phone: "phone",
  wechat: "wechat",
  apple: "apple",
  google: "google",
};

const resolveInitialMethod = (methods, preferredMethod = null) => {
  const availableMethods = Array.isArray(methods) ? methods : [];

  if (availableMethods.length === 0) {
    return preferredMethod ?? null;
  }

  if (availableMethods.includes(USERNAME_METHOD)) {
    return USERNAME_METHOD;
  }

  if (preferredMethod && availableMethods.includes(preferredMethod)) {
    return preferredMethod;
  }

  return availableMethods[0] ?? preferredMethod ?? null;
};

function AuthForm({
  title,
  switchText,
  switchLink,
  onSubmit,
  placeholders = {},
  formMethods = [],
  methodOrder = [],
  defaultMethod = null,
  validateAccount = () => true,
  passwordPlaceholder = "Password",
  showCodeButton = () => false,
  icons = defaultIcons,
}) {
  const { lang, t } = useLanguage();
  const brandText = useMemo(() => getBrandText(lang), [lang]);
  const availableFormMethods = useMemo(
    () => (Array.isArray(formMethods) ? formMethods : []),
    [formMethods],
  );
  const orderedMethods = useMemo(
    () => (Array.isArray(methodOrder) ? methodOrder : []),
    [methodOrder],
  );
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState(() =>
    resolveInitialMethod(availableFormMethods, defaultMethod),
  );
  const [showNotice, setShowNotice] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState("");
  const otherLoginOptionsLabel = t.otherLoginOptions ?? "Other login options";
  const handleSendCode = () => {};

  useEffect(() => {
    const preferredMethod = resolveInitialMethod(
      availableFormMethods,
      defaultMethod,
    );
    setMethod((currentMethod) => {
      if (availableFormMethods.includes(currentMethod)) {
        return currentMethod;
      }
      return preferredMethod;
    });
  }, [availableFormMethods, defaultMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNoticeMsg("");
    if (!validateAccount(account, method)) {
      setNoticeMsg(t.invalidAccount || "Invalid account");
      setShowNotice(true);
      return;
    }
    try {
      await onSubmit({ account, password, method });
    } catch (err) {
      setNoticeMsg(err.message);
      setShowNotice(true);
    }
  };

  const renderForm = () => {
    if (!availableFormMethods.includes(method)) {
      return null;
    }
    const passHolder =
      typeof passwordPlaceholder === "function"
        ? passwordPlaceholder(method)
        : passwordPlaceholder;
    const hasCodeButton = showCodeButton(method);
    const passwordRowClassName =
      styles[hasCodeButton ? "password-row" : "password-row-single"];

    return (
      <form onSubmit={handleSubmit} className={styles["auth-form"]}>
        {method === "phone" ? (
          <PhoneInput
            value={account}
            onChange={setAccount}
            placeholder={placeholders.phone}
          />
        ) : (
          <input
            className={styles["auth-input"]}
            placeholder={placeholders[method]}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        )}
        <div className={passwordRowClassName}>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passHolder}
            mask={!hasCodeButton}
            inputClassName={styles["auth-input"]}
            autoComplete={hasCodeButton ? "one-time-code" : undefined}
          />
          {hasCodeButton && <CodeButton onClick={handleSendCode} />}
        </div>
        <Button type="submit" className={styles["auth-primary-btn"]}>
          {t.continueButton}
        </Button>
      </form>
    );
  };

  return (
    <div className={styles["auth-page"]}>
      <ThemeIcon
        name="glancy-web"
        alt={brandText}
        className={styles["auth-logo"]}
      />
      <div className={styles["auth-brand"]}>{brandText}</div>
      <MultiLineText as="h1" className={styles["auth-title"]} text={title} />
      {renderForm()}
      <div className={styles["auth-switch"]}>
        {switchText}{" "}
        <Link to={switchLink}>
          {switchLink.includes("login") ? t.loginButton : t.registerButton}
        </Link>
      </div>
      <div
        className={styles.divider}
        role="separator"
        aria-label={otherLoginOptionsLabel}
      >
        <span className={styles["divider-label"]}>
          {otherLoginOptionsLabel}
        </span>
      </div>
      <div className={styles["login-options"]}>
        {orderedMethods
          .filter((m) => m !== method)
          .map((m) => {
            const iconName = icons[m];
            return (
              <Button
                key={m}
                type="button"
                onClick={() => {
                  if (availableFormMethods.includes(m)) {
                    setMethod(m);
                  } else {
                    setNoticeMsg(t.notImplementedYet || "Not implemented yet");
                    setShowNotice(true);
                  }
                }}
              >
                <ThemeIcon name={iconName} alt={m} />
              </Button>
            );
          })}
      </div>
      <div className={styles["auth-footer"]}>
        <div className={styles["footer-links"]}>
          <a href="#">{t.termsOfUse}</a> | <a href="#">{t.privacyPolicy}</a>
        </div>
        <ICP />
      </div>
      <MessagePopup
        open={showNotice}
        message={noticeMsg}
        onClose={() => setShowNotice(false)}
      />
    </div>
  );
}

export default AuthForm;
