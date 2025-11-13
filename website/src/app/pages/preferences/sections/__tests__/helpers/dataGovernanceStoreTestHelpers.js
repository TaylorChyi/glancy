import { useDataGovernanceStore } from "@core/store/dataGovernanceStore.ts";

const captureDataGovernanceSnapshot = () => {
  const state = useDataGovernanceStore.getState();
  return { ...state };
};

export const installDataGovernanceStoreState = (
  overrides = {},
) => {
  const snapshot = captureDataGovernanceSnapshot();

  useDataGovernanceStore.setState(
    {
      ...snapshot,
      historyCaptureEnabled: true,
      retentionPolicyId: "90d",
      ...overrides,
    },
    true,
  );

  return {
    restore: () => useDataGovernanceStore.setState(snapshot, true),
    getState: () => useDataGovernanceStore.getState(),
  };
};
