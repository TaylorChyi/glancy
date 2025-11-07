import { useMemo } from "react";

export const PREFERENCE_HEADING_ID = "settings-heading";

const resolvePlanLabel = (user) => {
  if (!user) {
    return "";
  }
  const planCandidate =
    (typeof user.plan === "string" && user.plan.trim()) ||
    (user.isPro ? "plus" : "");
  if (!planCandidate) {
    return "";
  }
  const normalized = planCandidate.trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const createAccountCopy = (translations) => ({
  defaultPhoneCode: translations.settingsAccountDefaultPhoneCode ?? "+86",
  changeAvatarLabel: translations.changeAvatar ?? "Change avatar",
  bindingsTitle:
    translations.settingsAccountBindingTitle ?? "Connected accounts",
  bindingStatus:
    translations.settingsAccountBindingStatusUnlinked ?? "Not linked",
  bindingActionLabel:
    translations.settingsAccountBindingActionPlaceholder ?? "Coming soon",
});

export const usePreferenceCopy = ({ translations, user }) => {
  const fallbackValue = translations.settingsEmptyValue ?? "—";
  const description = translations.prefDescription ?? "";
  const hasDescription = Boolean(description && description.trim());
  const descriptionId = hasDescription ? "settings-description" : undefined;
  const title = translations.prefTitle ?? "Preferences";
  const tablistLabel = translations.prefTablistLabel ?? "Preference sections";
  const closeLabel = translations.close ?? "Close";

  const planLabel = useMemo(() => resolvePlanLabel(user), [user]);
  const accountCopy = useMemo(
    () => createAccountCopy(translations),
    [translations],
  );

  return {
    copy: {
      title,
      description,
      tablistLabel,
      closeLabel,
    },
    header: {
      headingId: PREFERENCE_HEADING_ID,
      descriptionId,
      planLabel,
    },
    fallbackValue,
    account: accountCopy,
  };
};
