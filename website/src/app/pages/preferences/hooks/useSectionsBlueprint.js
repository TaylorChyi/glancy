import { useMemo } from "react";
import { createSections } from "./createSections.js";

export const useSectionsBlueprint = ({
  translations,
  responseStylePreferences,
  responseStyleCopy,
  accountModel,
  subscriptionSection,
}) =>
  useMemo(
    () =>
      createSections({
        translations,
        responseStyleState: responseStylePreferences.state,
        responseStyleCopy,
        responseStyleHandlers: {
          onRetry: responseStylePreferences.handleRetry,
          onFieldChange: responseStylePreferences.handleFieldChange,
          onFieldCommit: responseStylePreferences.handleFieldCommit,
        },
        accountModel,
        subscriptionSection,
      }),
    [
      accountModel,
      responseStyleCopy,
      responseStylePreferences.handleFieldChange,
      responseStylePreferences.handleFieldCommit,
      responseStylePreferences.handleRetry,
      responseStylePreferences.state,
      subscriptionSection,
      translations,
    ],
  );
