import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CodeButton from "./CodeButton.jsx";
import PhoneInput from "./PhoneInput.jsx";
import Button from "@/components/ui/Button";
import MultiLineText from "@/components/ui/MultiLineText.jsx";
import styles from "./AuthForm.module.css";
import MessagePopup from "@/components/ui/MessagePopup";
import Toast from "@/components/ui/Toast";
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
  otherOptionsLabel,
  onRequestCode,
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
  const [toastFeedback, setToastFeedback] = useState({
    open: false,
    message: "",
  });
  const toastDismissLabel =
    t.toastDismissLabel || t.close || "Dismiss notification";
  /**
   * 采用“策略模式”调度不同的用户提示通道：
   *  - popupChannel：保留原遮罩式弹框以承载表单校验与错误提示；
   *  - toastChannel：用于成功类的轻量通知，下拉提示小框可减轻流程阻断。
   * 通过集中定义，后续若扩展 Snackbar/Inline 提示，可在此扩容而无需侵入主流程。
   */
  const feedbackChannels = {
    popup: (message) => {
      setNoticeMsg(message);
      setShowNotice(Boolean(message));
    },
    toast: (message) => {
      setToastFeedback({
        open: Boolean(message),
        message: message || "",
      });
    },
  };
  const fallbackOtherOptionsLabel =
    t.otherLoginOptions ?? "Other login options";
  const trimmedOtherOptionsLabel =
    typeof otherOptionsLabel === "string" ? otherOptionsLabel.trim() : "";
  const resolvedOtherOptionsLabel =
    trimmedOtherOptionsLabel || fallbackOtherOptionsLabel;
  const handleSendCode = async () => {
    const sanitizedAccount =
      typeof account === "string" ? account.trim() : account;

    if (sanitizedAccount !== account) {
      setAccount(sanitizedAccount);
    }

    if (!validateAccount(sanitizedAccount, method)) {
      feedbackChannels.popup(t.invalidAccount || "Invalid account");
      return false;
    }

    if (typeof onRequestCode !== "function") {
      const fallbackMessage =
        t.codeRequestInvalidMethod ||
        t.notImplementedYet ||
        "Verification code request is unavailable";
      feedbackChannels.popup(fallbackMessage);
      return false;
    }

    feedbackChannels.popup("");
    feedbackChannels.toast("");

    try {
      await onRequestCode({ account: sanitizedAccount, method });
      const successMessage =
        t.codeRequestSuccess ||
        "Verification code sent. Please check your inbox.";
      feedbackChannels.toast(successMessage);
      return true;
    } catch (err) {
      const errorMessage =
        (typeof err?.message === "string" && err.message.trim()) ||
        t.codeRequestFailed ||
        "Failed to send verification code";
      feedbackChannels.popup(errorMessage);
      return false;
    }
  };

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
    feedbackChannels.popup("");
    if (!validateAccount(account, method)) {
      feedbackChannels.popup(t.invalidAccount || "Invalid account");
      return;
    }
    try {
      await onSubmit({ account, password, method });
    } catch (err) {
      feedbackChannels.popup(err.message);
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
        aria-label={resolvedOtherOptionsLabel}
      >
        <span className={styles["divider-label"]}>
          {resolvedOtherOptionsLabel}
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
      <Toast
        open={toastFeedback.open}
        message={toastFeedback.message}
        onClose={() => setToastFeedback({ open: false, message: "" })}
        closeLabel={toastDismissLabel}
      />
    </div>
  );
}

export default AuthForm;
