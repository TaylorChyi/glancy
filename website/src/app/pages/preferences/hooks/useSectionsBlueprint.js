import { useMemo } from "react";
import { createSections } from "./createSections.js";

const mapResponseStyleHandlers = (preferences) => ({
  onRetry: preferences.handleRetry,
  onFieldChange: preferences.handleFieldChange,
  onFieldCommit: preferences.handleFieldCommit,
});

const buildSectionsConfig = ({
  translations,
  responseStylePreferences,
  responseStyleCopy,
  accountModel,
  subscriptionSection,
}) => ({
  translations,
  responseStyleState: responseStylePreferences.state,
  responseStyleCopy,
  responseStyleHandlers: mapResponseStyleHandlers(responseStylePreferences),
  accountModel,
  subscriptionSection,
});

const useSectionsConfig = (params) => {
  const {
    accountModel,
    responseStyleCopy,
    responseStylePreferences,
    subscriptionSection,
    translations,
  } = params;

  return useMemo(
    () =>
      buildSectionsConfig({
        accountModel,
        responseStyleCopy,
        responseStylePreferences,
        subscriptionSection,
        translations,
      }),
    [
      accountModel,
      responseStyleCopy,
      responseStylePreferences,
      subscriptionSection,
      translations,
    ],
  );
};

export const useSectionsBlueprint = (params) => {
  const sectionsConfig = useSectionsConfig(params);
  return useMemo(() => createSections(sectionsConfig), [sectionsConfig]);
};
