import { useLanguage } from "@/context";

const USERNAME_METHOD = "username";
const PRIMARY_METHODS = Object.freeze(["phone", "email"]);
const SUPPORTED_SOCIAL_METHODS = Object.freeze(["wechat", "apple", "google"]);

export function useAuthFormConfig({ includeUsername = false } = {}) {
  const { t } = useLanguage();

  const placeholders = {
    phone: t.phonePlaceholder,
    email: t.emailPlaceholder,
    ...(includeUsername && { username: t.usernamePlaceholder }),
  };

  const baseFormMethods = [...PRIMARY_METHODS];
  const baseMethodOrder = [...PRIMARY_METHODS, ...SUPPORTED_SOCIAL_METHODS];

  const formMethods = includeUsername
    ? [USERNAME_METHOD, ...baseFormMethods]
    : baseFormMethods;

  const methodOrder = includeUsername
    ? [USERNAME_METHOD, ...baseMethodOrder]
    : baseMethodOrder;

  return { placeholders, formMethods, methodOrder };
}
