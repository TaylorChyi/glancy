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

const buildControllerOptions = ({
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
  onSubmit,
} = {}) => ({
  placeholders,
  formMethods,
  methodOrder,
  defaultMethod,
  validateAccount,
  passwordPlaceholder,
  showCodeButton,
  icons,
  otherOptionsLabel,
  onRequestCode,
  onSubmit,
});

const useAuthFormPresentation = (options = {}) => {
  const { lang, t } = useLanguage();
  const brandText = useMemo(() => getBrandText(lang), [lang]);
  const controller = useAuthFormController({
    ...buildControllerOptions(options),
    t,
  });
  const { switchLink, switchText, title } = options;

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
