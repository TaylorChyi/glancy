import { useUser } from "@core/context";
import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";

const useGovernanceSlice = () =>
  useDataGovernanceStore((state) => ({
    historyCaptureEnabled: state.historyCaptureEnabled,
    retentionPolicyId: state.retentionPolicyId,
    setHistoryCaptureEnabled: state.setHistoryCaptureEnabled,
    setRetentionPolicy: state.setRetentionPolicy,
  }));

const useHistorySlice = () =>
  useHistoryStore((state) => ({
    history: state.history,
    clearHistory: state.clearHistory,
    clearHistoryByLanguage: state.clearHistoryByLanguage,
    applyRetentionPolicy: state.applyRetentionPolicy,
  }));

export const useDataSectionState = () => {
  const user = useUser()?.user ?? null;
  const governance = useGovernanceSlice();
  const historyState = useHistorySlice();

  return { user, governance, historyState };
};

export default useDataSectionState;
