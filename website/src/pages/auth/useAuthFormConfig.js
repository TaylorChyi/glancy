import { useLanguage } from "@/context";

const USERNAME_METHOD = "username";
const PRIMARY_METHODS = Object.freeze(["phone", "email"]);
const SUPPORTED_SOCIAL_METHODS = Object.freeze(["wechat", "apple", "google"]);

const buildFormMethods = (includeUsername) => {
  const methods = [...PRIMARY_METHODS];

  if (includeUsername && !methods.includes(USERNAME_METHOD)) {
    methods.unshift(USERNAME_METHOD);
  }

  return methods;
};

const buildMethodOrder = (includeUsername) => {
  const order = [...PRIMARY_METHODS, ...SUPPORTED_SOCIAL_METHODS];

  if (includeUsername && !order.includes(USERNAME_METHOD)) {
    order.unshift(USERNAME_METHOD);
  }

  return order;
};

export function useAuthFormConfig({ includeUsername = false } = {}) {
  const { t } = useLanguage();

  const placeholders = {
    phone: t.phonePlaceholder,
    email: t.emailPlaceholder,
    ...(includeUsername && { username: t.usernamePlaceholder }),
  };

  const formMethods = buildFormMethods(includeUsername);
  const methodOrder = buildMethodOrder(includeUsername);
  const defaultMethod = includeUsername
    ? USERNAME_METHOD
    : (formMethods[0] ?? null);

  return { placeholders, formMethods, methodOrder, defaultMethod };
}
