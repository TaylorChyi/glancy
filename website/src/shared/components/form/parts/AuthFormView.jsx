import styles from "../AuthForm.module.css";
import AuthMethodForm from "./AuthMethodForm.jsx";
import {
  AuthFormHeader,
  AuthFormSwitch,
  AuthMethodDivider,
  AuthMethodSwitcher,
  AuthFormFooter,
  AuthFeedbackHub,
} from "./AuthFormSections.jsx";

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
      <AuthFormSwitch switchLink={switchLink} switchText={switchText} t={t} />
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

export default AuthFormView;
