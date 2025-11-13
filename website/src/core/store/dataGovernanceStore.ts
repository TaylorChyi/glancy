import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import type { GovernancePreferences } from "./dataGovernanceNormalization.js";
import {
  DEFAULT_RETENTION_POLICY_ID,
  sanitizePolicyId,
} from "./dataGovernanceNormalization.js";
import {
  DATA_GOVERNANCE_STORAGE_KEY,
  deriveInitialPreferences,
  loadPersistedGovernanceSnapshot,
  normalizeRehydratedPreferences,
} from "./dataGovernancePersistence.js";

export type { DataRetentionPolicy } from "./dataGovernanceNormalization.js";
export { DATA_RETENTION_POLICIES, getRetentionPolicyById } from "./dataGovernanceNormalization.js";

type DataGovernanceState = GovernancePreferences & {
  setRetentionPolicy: (policyId: string) => void;
  setHistoryCaptureEnabled: (enabled: boolean) => void;
};

const defaultPreferences: GovernancePreferences = {
  retentionPolicyId: DEFAULT_RETENTION_POLICY_ID,
  historyCaptureEnabled: true,
};

const persistedSnapshot = loadPersistedGovernanceSnapshot();
const initialPreferences = deriveInitialPreferences(
  persistedSnapshot,
  defaultPreferences,
);

type StoreSetter = (
  updater: (state: DataGovernanceState) => Partial<DataGovernanceState>,
) => void;

const createRetentionPolicySetter =
  (set: StoreSetter) => (policyId: string) => {
    const normalized = sanitizePolicyId(policyId);
    set((state) =>
      state.retentionPolicyId === normalized
        ? {}
        : { retentionPolicyId: normalized },
    );
  };

const createHistoryCaptureSetter =
  (set: StoreSetter) => (enabled: boolean) => {
    const next = Boolean(enabled);
    set((state) =>
      state.historyCaptureEnabled === next
        ? {}
        : { historyCaptureEnabled: next },
    );
  };

const buildInitialGovernanceState = (
  set: StoreSetter,
  preferences: GovernancePreferences,
) => ({
  retentionPolicyId: preferences.retentionPolicyId,
  historyCaptureEnabled: preferences.historyCaptureEnabled,
  setRetentionPolicy: createRetentionPolicySetter(set),
  setHistoryCaptureEnabled: createHistoryCaptureSetter(set),
});

const createDataGovernanceInitializer = (
  preferences: GovernancePreferences,
) =>
  (set: StoreSetter) => buildInitialGovernanceState(set, preferences);

export const useDataGovernanceStore =
  createPersistentStore<DataGovernanceState>({
    key: DATA_GOVERNANCE_STORAGE_KEY,
    initializer: createDataGovernanceInitializer(initialPreferences),
    persistOptions: {
      partialize: pickState(["retentionPolicyId", "historyCaptureEnabled"]),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        normalizeRehydratedPreferences(state);
      },
    },
  });
