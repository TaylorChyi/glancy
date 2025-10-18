/**
 * 背景：
 *  - 历史版本的 AuthForm 同时承载状态管控与整页渲染，导致函数体超出结构化 lint 限制。
 * 目的：
 *  - 引入容器（状态）与展示（视图）分离的组件结构，便于扩展新的登录方式与通知策略。
 * 关键决策与取舍：
 *  - 采用“Presenter 模式”将渲染细节迁移到独立的 AuthFormView，主组件专注于状态与副作用；
 *  - 抽象 useFeedbackChannels Hook，统一调度弹窗与 Toast，后续如需加入 Snackbar 可在此扩展；
 *  - 保留现有 props 接口，确保与上下游调用方兼容，避免一次性兼容层。
 * 影响范围：
 *  - 登录/注册流程共用的 AuthForm 组件与其通知行为。
 * 演进与TODO：
 *  - 后续可引入特性开关以控制第三方登录按钮排序，并为 useFeedbackChannels 增添埋点。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CodeButton from "./CodeButton.jsx";
import PhoneInput from "./PhoneInput.jsx";
import Button from "@shared/components/ui/Button";
import MultiLineText from "@shared/components/ui/MultiLineText.jsx";
import styles from "./AuthForm.module.css";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import ThemeIcon from "@shared/components/ui/Icon";
import ICP from "@shared/components/ui/ICP";
import PasswordInput from "@shared/components/ui/PasswordInput";
import { useLanguage } from "@core/context";
import { getBrandText } from "@shared/utils";

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

const sanitizeAccount = (value) =>
  typeof value === "string" ? value.trim() : value;

/**
 * 意图：集中调度弹窗/吐司提示，强化扩展性。
 * 输入：无（内部管理状态）。
 * 输出：暴露 popup/toast 状态与开闭控制器。
 * 流程：
 *  1) 初始化两个通道的状态结构；
 *  2) 提供显示/重置方法，供容器组件复用；
 *  3) 未来若新增渠道，可在此 Hook 内统一编排。
 * 错误处理：无外部副作用，不涉及重试。
 * 复杂度：O(1) —— 仅维护常量状态。
 */
const useFeedbackChannels = () => {
  const [popup, setPopup] = useState({ open: false, message: "" });
  const [toast, setToast] = useState({ open: false, message: "" });

  const showPopup = useCallback((message) => {
    setPopup({ open: Boolean(message), message: message ?? "" });
  }, []);

  const showToast = useCallback((message) => {
    setToast({ open: Boolean(message), message: message ?? "" });
  }, []);

  const resetPopup = useCallback(() => {
    setPopup({ open: false, message: "" });
  }, []);

  const resetToast = useCallback(() => {
    setToast({ open: false, message: "" });
  }, []);

  return {
    popup,
    toast,
    showPopup,
    showToast,
    resetPopup,
    resetToast,
  };
};

const useAuthMethods = ({ formMethods, methodOrder, defaultMethod }) => {
  const availableFormMethods = useMemo(
    () => (Array.isArray(formMethods) ? formMethods : []),
    [formMethods],
  );
  const orderedMethods = useMemo(
    () => (Array.isArray(methodOrder) ? methodOrder : []),
    [methodOrder],
  );
  const [method, setMethod] = useState(() =>
    resolveInitialMethod(availableFormMethods, defaultMethod),
  );

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

  return { availableFormMethods, orderedMethods, method, setMethod };
};

const useOtherOptionsLabel = (otherOptionsLabel, t) =>
  useMemo(() => {
    const fallback = t.otherLoginOptions ?? "Other login options";
    const trimmed =
      typeof otherOptionsLabel === "string" ? otherOptionsLabel.trim() : "";
    return trimmed || fallback;
  }, [otherOptionsLabel, t]);

const useToastDismissLabel = (t) =>
  useMemo(
    () => t.toastDismissLabel || t.close || "Dismiss notification",
    [t],
  );

const useCodeRequestHandler = ({
  account,
  method,
  onRequestCode,
  setAccount,
  showPopup,
  showToast,
  t,
  validateAccount,
}) =>
  useCallback(async () => {
    const sanitizedAccount = sanitizeAccount(account);

    if (sanitizedAccount !== account) {
      setAccount(sanitizedAccount);
    }

    if (!validateAccount(sanitizedAccount, method)) {
      showPopup(t.invalidAccount || "Invalid account");
      return false;
    }

    if (typeof onRequestCode !== "function") {
      const fallbackMessage =
        t.codeRequestInvalidMethod ||
        t.notImplementedYet ||
        "Verification code request is unavailable";
      showPopup(fallbackMessage);
      return false;
    }

    showPopup("");
    showToast("");

    try {
      await onRequestCode({ account: sanitizedAccount, method });
      const successMessage =
        t.codeRequestSuccess ||
        "Verification code sent. Please check your inbox.";
      showToast(successMessage);
      return true;
    } catch (err) {
      const errorMessage =
        (typeof err?.message === "string" && err.message.trim()) ||
        t.codeRequestFailed ||
        "Failed to send verification code";
      showPopup(errorMessage);
      return false;
    }
  }, [
    account,
    method,
    onRequestCode,
    setAccount,
    showPopup,
    showToast,
    t,
    validateAccount,
  ]);

const useSubmitHandler = ({
  account,
  method,
  onSubmit,
  password,
  showPopup,
  t,
  validateAccount,
}) =>
  useCallback(
    async (event) => {
      event.preventDefault();
      showPopup("");
      if (!validateAccount(account, method)) {
        showPopup(t.invalidAccount || "Invalid account");
        return;
      }
      try {
        await onSubmit({ account, password, method });
      } catch (err) {
        const fallbackMessage =
          (typeof err?.message === "string" && err.message.trim()) ||
          t.genericRequestFailed ||
          "Request failed";
        showPopup(fallbackMessage);
      }
    },
    [account, method, onSubmit, password, showPopup, t, validateAccount],
  );

const useUnavailableMethodHandler = (showPopup, t) =>
  useCallback(
    () => showPopup(t.notImplementedYet || "Not implemented yet"),
    [showPopup, t],
  );

const composeControllerModel = ({
  account,
  availableFormMethods,
  feedback,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  onUnavailableMethod,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
  setAccount,
  setMethod,
  setPassword,
  showCodeButton,
  toastDismissLabel,
}) => ({
  account,
  availableFormMethods,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  onMethodChange: setMethod,
  onUnavailableMethod,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
  popup: feedback.popup,
  resetPopup: feedback.resetPopup,
  resetToast: feedback.resetToast,
  setAccount,
  setPassword,
  showCodeButton,
  toast: feedback.toast,
  toastDismissLabel,
});

const useAuthFormController = ({
  formMethods,
  methodOrder,
  defaultMethod,
  validateAccount,
  passwordPlaceholder,
  showCodeButton,
  icons,
  otherOptionsLabel,
  placeholders,
  onRequestCode,
  onSubmit,
  t,
}) => {
  const { availableFormMethods, orderedMethods, method, setMethod } =
    useAuthMethods({ formMethods, methodOrder, defaultMethod });
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const feedback = useFeedbackChannels();
  const toastDismissLabel = useToastDismissLabel(t);
  const resolvedOtherOptionsLabel = useOtherOptionsLabel(otherOptionsLabel, t);
  const handleSendCode = useCodeRequestHandler({
    account,
    method,
    onRequestCode,
    setAccount,
    showPopup: feedback.showPopup,
    showToast: feedback.showToast,
    t,
    validateAccount,
  });
  const handleSubmit = useSubmitHandler({
    account,
    method,
    onSubmit,
    password,
    showPopup: feedback.showPopup,
    t,
    validateAccount,
  });
  const onUnavailableMethod = useUnavailableMethodHandler(
    feedback.showPopup,
    t,
  );

  return composeControllerModel({
    account,
    availableFormMethods,
    feedback,
    handleSendCode,
    handleSubmit,
    icons,
    method,
    onUnavailableMethod,
    orderedMethods,
    otherOptionsLabel: resolvedOtherOptionsLabel,
    password,
    passwordPlaceholder,
    placeholders,
    setAccount,
    setMethod,
    setPassword,
    showCodeButton,
    toastDismissLabel,
  });
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
  const controller = useAuthFormController({
    formMethods,
    methodOrder,
    defaultMethod,
    validateAccount,
    passwordPlaceholder,
    showCodeButton,
    icons,
    otherOptionsLabel,
    placeholders,
    onRequestCode,
    onSubmit,
    t,
  });

  return (
    <AuthFormView
      {...controller}
      brandText={brandText}
      switchLink={switchLink}
      switchText={switchText}
      t={t}
      title={title}
    />
  );
}

export default AuthForm;
export {
  resolveInitialMethod,
  sanitizeAccount,
  useAuthFormController,
  useFeedbackChannels,
};

function AuthFormView({
  account,
  availableFormMethods,
  brandText,
  handleSendCode,
  handleSubmit,
  icons,
  method,
  onMethodChange,
  onUnavailableMethod,
  orderedMethods,
  otherOptionsLabel,
  password,
  passwordPlaceholder,
  placeholders,
  popup,
  resetPopup,
  resetToast,
  setAccount,
  setPassword,
  showCodeButton,
  switchLink,
  switchText,
  t,
  title,
  toast,
  toastDismissLabel,
}) {
  return (
    <div className={styles["auth-page"]}>
      <AuthFormHeader brandText={brandText} title={title} />
      <AuthMethodForm
        account={account}
        availableFormMethods={availableFormMethods}
        handleSendCode={handleSendCode}
        handleSubmit={handleSubmit}
        method={method}
        password={password}
        passwordPlaceholder={passwordPlaceholder}
        placeholders={placeholders}
        setAccount={setAccount}
        setPassword={setPassword}
        showCodeButton={showCodeButton}
        t={t}
      />
      <AuthFormSwitch
        switchLink={switchLink}
        switchText={switchText}
        t={t}
      />
      <AuthMethodDivider label={otherOptionsLabel} />
      <AuthMethodSwitcher
        availableFormMethods={availableFormMethods}
        icons={icons}
        method={method}
        onMethodChange={onMethodChange}
        onUnavailableMethod={onUnavailableMethod}
        orderedMethods={orderedMethods}
      />
      <AuthFormFooter t={t} />
      <AuthFeedbackHub
        popup={popup}
        toast={toast}
        resetPopup={resetPopup}
        resetToast={resetToast}
        toastDismissLabel={toastDismissLabel}
      />
    </div>
  );
}

function AuthFormHeader({ brandText, title }) {
  return (
    <>
      <ThemeIcon
        name="glancy-web"
        alt={brandText}
        className={styles["auth-logo"]}
      />
      <div className={styles["auth-brand"]}>{brandText}</div>
      <MultiLineText as="h1" className={styles["auth-title"]} text={title} />
    </>
  );
}

function AuthMethodForm({
  account,
  availableFormMethods,
  handleSendCode,
  handleSubmit,
  method,
  password,
  passwordPlaceholder,
  placeholders,
  setAccount,
  setPassword,
  showCodeButton,
  t,
}) {
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
          onChange={(event) => setAccount(event.target.value)}
        />
      )}
      <div className={passwordRowClassName}>
        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
}

function AuthFormSwitch({ switchLink, switchText, t }) {
  const switchLabel = switchLink.includes("login")
    ? t.loginButton
    : t.registerButton;

  return (
    <div className={styles["auth-switch"]}>
      {switchText}{" "}
      <Link to={switchLink}>{switchLabel}</Link>
    </div>
  );
}

function AuthMethodDivider({ label }) {
  return (
    <div className={styles.divider} role="separator" aria-label={label}>
      <span className={styles["divider-label"]}>{label}</span>
    </div>
  );
}

function AuthMethodSwitcher({
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
        .map((candidate) => {
          const iconName = icons[candidate];
          return (
            <Button
              key={candidate}
              type="button"
              onClick={() => {
                if (availableFormMethods.includes(candidate)) {
                  onMethodChange(candidate);
                } else {
                  onUnavailableMethod();
                }
              }}
            >
              <ThemeIcon name={iconName} alt={candidate} />
            </Button>
          );
        })}
    </div>
  );
}

function AuthFormFooter({ t }) {
  return (
    <div className={styles["auth-footer"]}>
      <div className={styles["footer-links"]}>
        <a href="#">{t.termsOfUse}</a> | <a href="#">{t.privacyPolicy}</a>
      </div>
      <ICP />
    </div>
  );
}

function AuthFeedbackHub({ popup, resetPopup, resetToast, toast, toastDismissLabel }) {
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
