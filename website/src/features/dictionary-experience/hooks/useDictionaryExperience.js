import { useDictionaryExperienceCore } from "./useDictionaryExperienceCore.js";
import { useDictionaryRequests } from "./useDictionaryRequests.js";
import { useDictionaryViewModel } from "./useDictionaryViewModel.js";
import { useDictionaryExperienceLifecycle } from "./useDictionaryExperienceLifecycle.js";

export { COPY_FEEDBACK_STATES } from "./useDictionaryCopyController.js";

export function useDictionaryExperience() {
  const core = useDictionaryExperienceCore();
  const requests = useDictionaryRequests(core);

  useDictionaryExperienceLifecycle({
    user: core.contexts.userContext.user,
    loadHistory: core.contexts.historyContext.loadHistory,
    state: core.state,
    wordStoreApi: core.wordStoreApi,
    wordEntries: core.wordEntries,
    resetDictionaryHomeState: core.homeControls.resetDictionaryHomeState,
    closeReportDialog: core.reporting.closeReportDialog,
    hydrateRecord: requests.hydrateRecord,
  });

  return useDictionaryViewModel({ core, requests });
}
