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

function AuthFormView(props) {
  return (
    <div className={styles["auth-page"]}>
      {renderAuthFormHeader(props)}
      {renderAuthMethodForm(props)}
      {renderAuthFormSwitch(props)}
      {renderAuthMethodDivider(props)}
      {renderAuthMethodSwitcher(props)}
      {renderAuthFormFooter(props)}
      {renderAuthFeedbackHub(props)}
    </div>
  );
}

function renderAuthFormHeader({ brandText, title }) {
  return <AuthFormHeader brandText={brandText} title={title} />;
}

function renderAuthMethodForm(props) {
  return <AuthMethodForm {...props} />;
}

function renderAuthFormSwitch({ switchLink, switchText, t }) {
  return <AuthFormSwitch switchLink={switchLink} switchText={switchText} t={t} />;
}

function renderAuthMethodDivider({ otherOptionsLabel }) {
  return <AuthMethodDivider label={otherOptionsLabel} />;
}

function renderAuthMethodSwitcher({
  availableFormMethods,
  icons,
  method,
  onMethodChange,
  onUnavailableMethod,
  orderedMethods,
}) {
  return (
    <AuthMethodSwitcher
      availableFormMethods={availableFormMethods}
      icons={icons}
      method={method}
      onMethodChange={onMethodChange}
      onUnavailableMethod={onUnavailableMethod}
      orderedMethods={orderedMethods}
    />
  );
}

function renderAuthFormFooter({ t }) {
  return <AuthFormFooter t={t} />;
}

function renderAuthFeedbackHub({
  popup,
  toast,
  resetPopup,
  resetToast,
  toastDismissLabel,
}) {
  return (
    <AuthFeedbackHub
      popup={popup}
      toast={toast}
      resetPopup={resetPopup}
      resetToast={resetToast}
      toastDismissLabel={toastDismissLabel}
    />
  );
}

export default AuthFormView;
