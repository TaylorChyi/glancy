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
