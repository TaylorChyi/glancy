import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";
import { useHistoryStore } from "@core/store/historyStore.ts";

const captureDataGovernanceSnapshot = () => {
  const state = useDataGovernanceStore.getState();
  return { ...state };
};

export const installDataGovernanceStoreState = (
  overrides = {},
) => {
  const snapshot = captureDataGovernanceSnapshot();
  const retentionHandler =
    overrides.applyRetentionPolicy ??
    snapshot.applyRetentionPolicy ??
    useHistoryStore.getState().applyRetentionPolicy;

  useDataGovernanceStore.setState(
    {
      ...snapshot,
      historyCaptureEnabled: true,
      retentionPolicyId: "90d",
      applyRetentionPolicy: retentionHandler,
      ...overrides,
    },
    true,
  );

  return {
    restore: () => useDataGovernanceStore.setState(snapshot, true),
    getState: () => useDataGovernanceStore.getState(),
  };
};
