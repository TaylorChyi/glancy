import { usePreferenceContext } from "./hooks/usePreferenceContext.js";
import { usePreferenceDomainServices } from "./hooks/usePreferenceDomainServices.js";
import { usePreferenceAvatarAndAccount } from "./hooks/usePreferenceAvatarAndAccount.js";
import { useSectionsBlueprint } from "./hooks/useSectionsBlueprint.js";
import { usePreferenceNavigation } from "./hooks/usePreferenceNavigation.js";
import { useStaticSubmitHandler } from "./hooks/useStaticSubmitHandler.js";
import { usePreferencePanel } from "./hooks/usePreferencePanel.js";
import { createPreferenceViewModel } from "./hooks/createPreferenceViewModel.js";

const usePreferenceSectionsContext = () => {
  const context = usePreferenceContext();
  const domainServices = usePreferenceDomainServices(context);

  return { ...context, domainServices };
};

const useAccountExperience = ({ translations, domainServices, user, setUser }) =>
  usePreferenceAvatarAndAccount({
    translations,
    preferenceCopy: domainServices.preferenceCopy,
    emailBinding: domainServices.emailBinding,
    updateUsernameRequest: domainServices.updateUsernameRequest,
    user,
    setUser,
  });

const useSectionsModel = ({ translations, accountModel, domainServices }) =>
  useSectionsBlueprint({
    translations,
    responseStylePreferences: domainServices.responseStylePreferences,
    responseStyleCopy: domainServices.responseStyleCopy,
    accountModel,
    subscriptionSection: domainServices.subscriptionSection,
  });

const useNavigationAndPanel = ({ initialSectionId, sections, preferenceCopy }) => {
  const navigation = usePreferenceNavigation({ initialSectionId, sections });
  const handleSubmit = useStaticSubmitHandler();
  const panel = usePreferencePanel({
    activeSection: navigation.activeSection,
    modalTitle: preferenceCopy.copy.title,
  });

  return { navigation: { ...navigation, handleSubmit }, panel };
};

function usePreferenceSections({ initialSectionId }) {
  const { translations, user, setUser, domainServices } =
    usePreferenceSectionsContext();
  const { preferenceCopy, redeemToast } = domainServices;

  const { accountModel, avatarEditorModalProps } = useAccountExperience({
    translations,
    domainServices,
    user,
    setUser,
  });

  const sections = useSectionsModel({ translations, accountModel, domainServices });

  const { navigation, panel } = useNavigationAndPanel({
    initialSectionId,
    sections,
    preferenceCopy,
  });

  return createPreferenceViewModel({
    preferenceCopy,
    sections,
    navigation,
    panel,
    avatarEditorModalProps,
    redeemToast,
  });
}

export default usePreferenceSections;
