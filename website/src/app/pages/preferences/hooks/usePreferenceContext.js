import { useLanguage, useUser } from "@core/context";

export const usePreferenceContext = () => {
  const { t } = useLanguage();
  const userStore = useUser();
  const { user, setUser } = userStore ?? {};

  return { translations: t, user, setUser };
};
