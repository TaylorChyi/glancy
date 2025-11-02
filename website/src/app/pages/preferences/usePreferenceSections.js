/**
 * 背景：
 *  - usePreferenceSections 先前集中了常量、工具函数与所有分区逻辑，文件体积超标且难以扩展。
 * 目的：
 *  - 采用“组合优先”的设计，将文案、账户模型、订阅兑换与响应风格状态拆分成子 Hook，
 *    主 Hook 仅负责装配结果，便于页面与模态复用。
 * 关键决策与取舍：
 *  - 以策略模式组织分区蓝图（createSections），保证结构化输出；
 *  - 将副作用集中在各自 Hook 内，降低耦合度并提升可测试性。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal；涉及账户、订阅、响应风格等分区的装配逻辑。
 * 演进与TODO：
 *  - 后续可在 createSections 中引入权限驱动的分区过滤或懒加载策略。
 */
import { usePreferenceContext } from "./hooks/usePreferenceContext.js";
import { usePreferenceDomainServices } from "./hooks/usePreferenceDomainServices.js";
import { usePreferenceAvatarAndAccount } from "./hooks/usePreferenceAvatarAndAccount.js";
import { useSectionsBlueprint } from "./hooks/useSectionsBlueprint.js";
import { usePreferenceNavigation } from "./hooks/usePreferenceNavigation.js";
import { useStaticSubmitHandler } from "./hooks/useStaticSubmitHandler.js";
import { usePreferencePanel } from "./hooks/usePreferencePanel.js";
import { createPreferenceViewModel } from "./hooks/createPreferenceViewModel.js";

function usePreferenceSections({ initialSectionId }) {
  const { translations, user, setUser } = usePreferenceContext();
  const domainServices = usePreferenceDomainServices({
    translations,
    user,
    setUser,
  });
  const { accountModel, avatarEditorModalProps } =
    usePreferenceAvatarAndAccount({
      translations,
      preferenceCopy: domainServices.preferenceCopy,
      emailBinding: domainServices.emailBinding,
      updateUsernameRequest: domainServices.updateUsernameRequest,
      user,
      setUser,
    });

  const sections = useSectionsBlueprint({
    translations,
    responseStylePreferences: domainServices.responseStylePreferences,
    responseStyleCopy: domainServices.responseStyleCopy,
    accountModel,
    subscriptionSection: domainServices.subscriptionSection,
  });
  const navigation = usePreferenceNavigation({ initialSectionId, sections });
  const handleSubmit = useStaticSubmitHandler();
  const panel = usePreferencePanel({
    activeSection: navigation.activeSection,
    modalTitle: domainServices.preferenceCopy.copy.title,
  });

  return createPreferenceViewModel({
    preferenceCopy: domainServices.preferenceCopy,
    sections,
    navigation: { ...navigation, handleSubmit },
    panel,
    avatarEditorModalProps,
    redeemToast: domainServices.redeemToast,
  });
}

export default usePreferenceSections;
