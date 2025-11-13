import { resolveStateStorage } from "./persistUtils.js";
import {
  DEFAULT_RETENTION_POLICY_ID,
  normalizeHistoryCapture,
  sanitizePolicyId,
  type GovernancePreferences,
} from "./dataGovernanceNormalization.js";

export type PersistedGovernanceSnapshot = Partial<GovernancePreferences>;

export const DATA_GOVERNANCE_STORAGE_KEY = "dataGovernance";

const readPersistedContainer = () => {
  const storage = resolveStateStorage(DATA_GOVERNANCE_STORAGE_KEY);
  return storage.getItem?.(DATA_GOVERNANCE_STORAGE_KEY) ?? null;
};

const parsePersistedContainer = (raw: string | null) => {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const selectPersistedState = (container: unknown) => {
  if (!container || typeof container !== "object") {
    return null;
  }
  return (container as { state?: unknown }).state ?? null;
};

const coerceSnapshot = (
  payload: unknown,
): PersistedGovernanceSnapshot | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const state = payload as Record<string, unknown>;
  const snapshot: PersistedGovernanceSnapshot = {};
  const retention = state.retentionPolicyId;
  if (typeof retention === "string") {
    snapshot.retentionPolicyId = retention;
  }
  const capture = state.historyCaptureEnabled;
  if (typeof capture === "boolean") {
    snapshot.historyCaptureEnabled = capture;
  } else if (typeof capture === "string") {
    snapshot.historyCaptureEnabled = capture === "true";
  }
  return snapshot;
};

export const loadPersistedGovernanceSnapshot = (): PersistedGovernanceSnapshot | null => {
  try {
    const container = parsePersistedContainer(readPersistedContainer());
    if (!container) {
      return null;
    }
    const payload = selectPersistedState(container);
    return coerceSnapshot(payload);
  } catch {
    return null;
  }
};

export const deriveInitialPreferences = (
  snapshot: PersistedGovernanceSnapshot | null,
  defaults: GovernancePreferences = {
    retentionPolicyId: DEFAULT_RETENTION_POLICY_ID,
    historyCaptureEnabled: true,
  },
): GovernancePreferences => ({
  retentionPolicyId: sanitizePolicyId(
    snapshot?.retentionPolicyId ?? defaults.retentionPolicyId,
  ),
  historyCaptureEnabled: normalizeHistoryCapture(
    snapshot?.historyCaptureEnabled,
    defaults.historyCaptureEnabled,
  ),
});

export const normalizeRehydratedPreferences = (
  state: GovernancePreferences,
): void => {
  state.retentionPolicyId = sanitizePolicyId(state.retentionPolicyId);
  state.historyCaptureEnabled = normalizeHistoryCapture(
    state.historyCaptureEnabled,
  );
};
