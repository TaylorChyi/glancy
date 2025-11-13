export type DataRetentionPolicy = {
  id: string;
  days: number | null;
};

export type GovernancePreferences = {
  retentionPolicyId: string;
  historyCaptureEnabled: boolean;
};

export const DATA_RETENTION_POLICIES: readonly DataRetentionPolicy[] =
  Object.freeze([
    { id: "30d", days: 30 },
    { id: "90d", days: 90 },
    { id: "365d", days: 365 },
    { id: "forever", days: null },
  ]);

export const DEFAULT_RETENTION_POLICY_ID = "90d";

const KNOWN_POLICY_IDS = new Set(
  DATA_RETENTION_POLICIES.map((policy) => policy.id),
);

export const sanitizePolicyId = (candidate?: string | null) => {
  if (!candidate) {
    return DEFAULT_RETENTION_POLICY_ID;
  }
  const normalized = String(candidate).trim();
  return KNOWN_POLICY_IDS.has(normalized)
    ? normalized
    : DEFAULT_RETENTION_POLICY_ID;
};

export const normalizeHistoryCapture = (
  candidate: unknown,
  fallback = true,
): boolean => {
  if (typeof candidate === "boolean") {
    return candidate;
  }
  if (typeof candidate === "string") {
    return candidate === "true";
  }
  return fallback;
};

export const getRetentionPolicyById = (policyId: string) =>
  DATA_RETENTION_POLICIES.find((policy) => policy.id === policyId) ?? null;
