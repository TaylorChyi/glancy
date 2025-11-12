import Button from "@shared/components/ui/Button";
import PasswordInput from "@shared/components/ui/PasswordInput";
import CodeButton from "../CodeButton.jsx";
import PhoneInput from "../PhoneInput.jsx";
import styles from "../AuthForm.module.css";

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

export default AuthMethodForm;
