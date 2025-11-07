import AccountSection from "../sections/AccountSection.jsx";
import DataSection from "../sections/DataSection.jsx";
import GeneralSection from "../sections/GeneralSection.jsx";
import KeyboardSection from "../sections/KeyboardSection.jsx";
import ResponseStyleSection from "../sections/ResponseStyleSection.jsx";
import SubscriptionSection from "../sections/SubscriptionSection.jsx";
import { SECTION_ICON_REGISTRY } from "./constants.js";
import { pickFirstMeaningfulString } from "./utils/displayValues.js";

const createGeneralSection = (translations) => {
  const label = translations.settingsTabGeneral ?? "General";
  return {
    id: "general",
    label,
    disabled: false,
    Component: GeneralSection,
    componentProps: { title: label },
    icon: SECTION_ICON_REGISTRY.general,
  };
};

const createResponseStyleSection = ({
  translations,
  responseStyleState,
  responseStyleCopy,
  responseStyleHandlers,
}) => {
  const label = translations.settingsTabPersonalization ?? "Response style";
  return {
    id: "responseStyle",
    label,
    disabled: false,
    Component: ResponseStyleSection,
    componentProps: {
      title: label,
      state: responseStyleState,
      copy: responseStyleCopy,
      onRetry: responseStyleHandlers.onRetry,
      onFieldChange: responseStyleHandlers.onFieldChange,
      onFieldCommit: responseStyleHandlers.onFieldCommit,
    },
    icon: SECTION_ICON_REGISTRY.responseStyle,
  };
};

const createDataSection = (translations) => {
  const label = translations.settingsTabData ?? "Data controls";
  const summary =
    translations.settingsDataDescription ??
    "Manage how Glancy stores and purges your historical traces.";
  const message = pickFirstMeaningfulString(
    [translations.settingsDataNotice, translations.settingsDataDescription],
    summary,
  );
  return {
    id: "data",
    label,
    disabled: false,
    Component: DataSection,
    componentProps: { title: label, message },
    icon: SECTION_ICON_REGISTRY.data,
  };
};

const createKeyboardSection = (translations) => {
  const label = translations.settingsTabKeyboard ?? "Keyboard shortcuts";
  return {
    id: "keyboard",
    label,
    disabled: false,
    Component: KeyboardSection,
    componentProps: { title: label },
    icon: SECTION_ICON_REGISTRY.keyboard,
  };
};

const createAccountSection = ({ translations, accountModel }) => {
  const label =
    translations.prefAccountTitle ??
    translations.settingsTabAccount ??
    "Account";
  return {
    id: "account",
    label,
    disabled: false,
    Component: AccountSection,
    componentProps: {
      title: label,
      fields: accountModel.fields,
      identity: accountModel.identity,
      bindings: accountModel.bindings,
    },
    icon: SECTION_ICON_REGISTRY.account,
  };
};

const createSubscriptionSection = (subscriptionSection) => ({
  id: "subscription",
  label: subscriptionSection.title,
  disabled: false,
  Component: SubscriptionSection,
  componentProps: subscriptionSection,
  icon: SECTION_ICON_REGISTRY.subscription,
});

export const createSections = ({
  translations,
  responseStyleState,
  responseStyleCopy,
  responseStyleHandlers,
  accountModel,
  subscriptionSection,
}) => [
  createGeneralSection(translations),
  createResponseStyleSection({
    translations,
    responseStyleState,
    responseStyleCopy,
    responseStyleHandlers,
  }),
  createDataSection(translations),
  createKeyboardSection(translations),
  createAccountSection({ translations, accountModel }),
  createSubscriptionSection(subscriptionSection),
];
