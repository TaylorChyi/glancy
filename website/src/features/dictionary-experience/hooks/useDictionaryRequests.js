import { useDictionaryRequestLoaders } from "../dictionaryRequests/internal/dictionaryRequestLoaders.js";
import { useDictionaryHistoryActions } from "../dictionaryRequests/internal/dictionaryRequestHistoryActions.js";

export function useDictionaryRequests(core) {
  const loaders = useDictionaryRequestLoaders(core);
  const historyActions = useDictionaryHistoryActions(core, {
    loadEntry: loaders.loadEntry,
    hydrateRecord: loaders.hydrateRecord,
  });

  return {
    ...loaders,
    ...historyActions,
  };
}
