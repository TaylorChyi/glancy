import Button from "@shared/components/ui/Button";
import PasswordInput from "@shared/components/ui/PasswordInput";
import CodeButton from "../CodeButton.jsx";
import PhoneInput from "../PhoneInput.jsx";
import styles from "../AuthForm.module.css";

const AccountField = ({
  method,
  account,
  setAccount,
  placeholders,
}) => {
  if (method === "phone") {
    return (
      <PhoneInput
        value={account}
        onChange={setAccount}
        placeholder={placeholders.phone}
      />
    );
  }

  const handleChange = (event) => setAccount(event.target.value);

  return (
    <input
      className={styles["auth-input"]}
      placeholder={placeholders[method]}
      value={account}
      onChange={handleChange}
    />
  );
};

const PasswordRow = ({
  hasCodeButton,
  password,
  setPassword,
  passHolder,
  handleSendCode,
}) => {
  const passwordRowClassName =
    styles[hasCodeButton ? "password-row" : "password-row-single"];
  const handlePasswordChange = (event) => setPassword(event.target.value);

  return (
    <div className={passwordRowClassName}>
      <PasswordInput
        value={password}
        onChange={handlePasswordChange}
        placeholder={passHolder}
        mask={!hasCodeButton}
        inputClassName={styles["auth-input"]}
        autoComplete={hasCodeButton ? "one-time-code" : undefined}
      />
      {hasCodeButton && <CodeButton onClick={handleSendCode} />}
    </div>
  );
};

const SubmitButton = ({ label }) => (
  <Button type="submit" className={styles["auth-primary-btn"]}>
    {label}
  </Button>
);

const resolvePasswordPlaceholder = (passwordPlaceholder, method) =>
  typeof passwordPlaceholder === "function"
    ? passwordPlaceholder(method)
    : passwordPlaceholder;

const AuthMethodFormContent = ({
  account,
  handleSendCode,
  handleSubmit,
  hasCodeButton,
  method,
  passHolder,
  password,
  placeholders,
  setAccount,
  setPassword,
  t,
}) => (
  <form onSubmit={handleSubmit} className={styles["auth-form"]}>
    <AccountField
      method={method}
      account={account}
      setAccount={setAccount}
      placeholders={placeholders}
    />
    <PasswordRow
      hasCodeButton={hasCodeButton}
      password={password}
      setPassword={setPassword}
      passHolder={passHolder}
      handleSendCode={handleSendCode}
    />
    <SubmitButton label={t.continueButton} />
  </form>
);

const AuthMethodForm = ({
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
}) =>
  availableFormMethods.includes(method) ? (
    <AuthMethodFormContent
      account={account}
      handleSendCode={handleSendCode}
      handleSubmit={handleSubmit}
      hasCodeButton={showCodeButton(method)}
      method={method}
      passHolder={resolvePasswordPlaceholder(passwordPlaceholder, method)}
      password={password}
      placeholders={placeholders}
      setAccount={setAccount}
      setPassword={setPassword}
      t={t} />
  ) : null;

export default AuthMethodForm;
