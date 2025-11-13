import { useMemo } from "react";
import { useLanguage } from "@core/context";
import { getBrandText } from "@shared/utils";
import { useAuthFormController } from "./authFormController.js";
import AuthFormView from "./parts/AuthFormView.jsx";

const defaultIcons = {
  username: "user",
  email: "email",
  phone: "phone",
  wechat: "wechat",
  apple: "apple",
  google: "google",
};

const useAuthFormPresentation = ({
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
}) => {
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

  return { brandText, controller, t };
};

const AuthForm = ({
  brandText,
  controller,
  switchLink,
  switchText,
  t,
  title,
}) => (
  <AuthFormView
    {...controller}
    brandText={brandText}
    switchLink={switchLink}
    switchText={switchText}
    t={t}
    title={title}
  />
);

const AuthFormContainer = (props) => {
  const { brandText, controller, t } = useAuthFormPresentation(props);

  return (
    <AuthForm
      brandText={brandText}
      controller={controller}
      switchLink={props.switchLink}
      switchText={props.switchText}
      t={t}
      title={props.title}
    />
  );
};

export { AuthForm };
export default AuthFormContainer;
