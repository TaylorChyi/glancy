import { useMemo } from "react";
import { useLanguage } from "@core/context";
import { getBrandText } from "@shared/utils";
import { useAuthFormController } from "../authFormController.js";

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
  switchLink,
  switchText,
  title,
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

  return {
    ...controller,
    brandText,
    switchLink,
    switchText,
    t,
    title,
  };
};

export { defaultIcons, useAuthFormPresentation };
