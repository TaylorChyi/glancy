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
import { useMemo } from "react";
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
import {
  useAuthFormController,
} from "./authFormController.js";

const defaultIcons = {
  username: "user",
  email: "email",
  phone: "phone",
  wechat: "wechat",
  apple: "apple",
  google: "google",
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
