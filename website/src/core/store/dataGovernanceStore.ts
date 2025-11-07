import { createPersistentStore } from "./createPersistentStore.js";
import { pickState, resolveStateStorage } from "./persistUtils.js";

export type DataRetentionPolicy = {
  id: string;
  days: number | null;
};

type DataGovernanceState = {
  retentionPolicyId: string;
  historyCaptureEnabled: boolean;
  setRetentionPolicy: (policyId: string) => void;
  setHistoryCaptureEnabled: (enabled: boolean) => void;
};

const DATA_GOVERNANCE_STORAGE_KEY = "dataGovernance";

export const DATA_RETENTION_POLICIES: readonly DataRetentionPolicy[] =
  Object.freeze([
    { id: "30d", days: 30 },
    { id: "90d", days: 90 },
    { id: "365d", days: 365 },
    { id: "forever", days: null },
  ]);

const DEFAULT_RETENTION_POLICY_ID = "90d";

const KNOWN_POLICY_IDS = new Set(
  DATA_RETENTION_POLICIES.map((policy) => policy.id),
);

const sanitizePolicyId = (candidate?: string | null) => {
  if (!candidate) {
    return DEFAULT_RETENTION_POLICY_ID;
  }
  const normalized = String(candidate).trim();
  return KNOWN_POLICY_IDS.has(normalized)
    ? normalized
    : DEFAULT_RETENTION_POLICY_ID;
};

type PersistedGovernanceSnapshot = Partial<
  Pick<DataGovernanceState, "retentionPolicyId" | "historyCaptureEnabled">
>;

/**
 * 意图：
 *  - 在 Store 初始化前同步读取持久化偏好，避免 rehydrate 过程中的默认值闪烁导致误判采集状态。
 * 输入：
 *  - 无（内部根据固定 storage key 访问持久化存储）。
 * 输出：
 *  - 若存在持久化数据则返回偏好快照，否则返回 null。
 * 流程：
 *  1) 访问 storage 读取原始 JSON；
 *  2) 解析 state 字段并抽取关心的属性；
 *  3) 过滤非布尔/字符串类型，确保结果可安全用于初始化。
 * 错误处理：
 *  - 捕获解析异常并返回 null，避免阻塞 Store 初始化。
 * 复杂度：
 *  - 时间 O(1)，空间 O(1)。
 */
const loadPersistedGovernanceSnapshot =
  (): PersistedGovernanceSnapshot | null => {
    try {
      const storage = resolveStateStorage(DATA_GOVERNANCE_STORAGE_KEY);
      const raw = storage.getItem?.(DATA_GOVERNANCE_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      const state = (parsed as { state?: unknown }).state;
      if (!state || typeof state !== "object") {
        return null;
      }
      const snapshot: PersistedGovernanceSnapshot = {};
      const retentionCandidate = (state as Record<string, unknown>)[
        "retentionPolicyId"
      ];
      if (typeof retentionCandidate === "string") {
        snapshot.retentionPolicyId = retentionCandidate;
      }
      const captureCandidate = (state as Record<string, unknown>)[
        "historyCaptureEnabled"
      ];
      if (typeof captureCandidate === "boolean") {
        snapshot.historyCaptureEnabled = captureCandidate;
      } else if (typeof captureCandidate === "string") {
        snapshot.historyCaptureEnabled = captureCandidate === "true";
      }
      return snapshot;
    } catch {
      return null;
    }
  };

const persistedSnapshot = loadPersistedGovernanceSnapshot();
const INITIAL_HISTORY_CAPTURE =
  typeof persistedSnapshot?.historyCaptureEnabled === "boolean"
    ? persistedSnapshot.historyCaptureEnabled
    : true;
const INITIAL_RETENTION_POLICY_ID = sanitizePolicyId(
  persistedSnapshot?.retentionPolicyId,
);

export const useDataGovernanceStore =
  createPersistentStore<DataGovernanceState>({
    key: DATA_GOVERNANCE_STORAGE_KEY,
    initializer: (set) => ({
      retentionPolicyId: INITIAL_RETENTION_POLICY_ID,
      historyCaptureEnabled: INITIAL_HISTORY_CAPTURE,
      setRetentionPolicy: (policyId: string) => {
        const normalized = sanitizePolicyId(policyId);
        set((state) => {
          if (state.retentionPolicyId === normalized) {
            return {};
          }
          return { retentionPolicyId: normalized };
        });
      },
      setHistoryCaptureEnabled: (enabled: boolean) => {
        const next = Boolean(enabled);
        set((state) => {
          if (state.historyCaptureEnabled === next) {
            return {};
          }
          return { historyCaptureEnabled: next };
        });
      },
    }),
    persistOptions: {
      partialize: pickState(["retentionPolicyId", "historyCaptureEnabled"]),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        const nextPolicy = sanitizePolicyId(state.retentionPolicyId);
        const normalizedCapture = Boolean(state.historyCaptureEnabled);
        if (
          state.retentionPolicyId !== nextPolicy ||
          state.historyCaptureEnabled !== normalizedCapture
        ) {
          useDataGovernanceStore.setState({
            retentionPolicyId: nextPolicy,
            historyCaptureEnabled: normalizedCapture,
          });
        }
      },
    },
  });

export const getRetentionPolicyById = (policyId: string) =>
  DATA_RETENTION_POLICIES.find((policy) => policy.id === policyId) ?? null;
