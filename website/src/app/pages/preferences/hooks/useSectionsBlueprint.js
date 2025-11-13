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

export const useSectionsBlueprint = (params) => {
  const sectionsConfig = useMemo(
    () => buildSectionsConfig(params),
    [
      params.accountModel,
      params.responseStyleCopy,
      params.responseStylePreferences.handleFieldChange,
      params.responseStylePreferences.handleFieldCommit,
      params.responseStylePreferences.handleRetry,
      params.responseStylePreferences.state,
      params.subscriptionSection,
      params.translations,
    ],
  );

  return useMemo(() => createSections(sectionsConfig), [sectionsConfig]);
};
