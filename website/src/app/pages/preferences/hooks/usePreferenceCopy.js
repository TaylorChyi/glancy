/**
 * 背景：
 *  - 偏好设置页面的文案散落在主 Hook 中，修改任一字段都需滚动整个文件。
 * 目的：
 *  - 通过 Hook 汇总所有展示层 copy，保持主 Hook 聚焦在装配逻辑。
 * 关键决策与取舍：
 *  - 输出结构化对象（copy/header/account 等），保证调用方语义明确；
 *  - 在 Hook 内部使用 useMemo 缓存派生值，避免重复计算。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的文案展示。
 * 演进与TODO：
 *  - 后续可在此加入 A/B 实验或多主题差异化文案。
 */
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
