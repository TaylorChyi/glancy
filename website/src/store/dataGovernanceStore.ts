/**
 * 背景：
 *  - 数据分区原仅有占位文案，无法支撑历史保留与导出等治理能力，导致策略变更需散落在各组件内完成。
 * 目的：
 *  - 以持久化 Store 承载数据保留窗口与历史采集开关，为偏好面板与其他特性提供统一查询与写入接口。
 * 关键决策与取舍：
 *  - 采用“持久化状态 + 策略枚举”模式：策略集合集中在常量中，Store 仅存储选择结果，避免魔法数字散落；
 *  - 拒绝在 Store 内直接依赖 History 实现，以防循环依赖，具体执行动作由上层协作完成。
 * 影响范围：
 *  - 偏好设置数据分区及未来可能读取历史策略的模块。
 * 演进与TODO：
 *  - TODO: 待后端提供 API 后，可在 Store 中追加同步远端策略的 effect；
 *  - TODO: 若引入企业级策略（按角色差异化），需扩展策略结构以承载条件。
 */
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";

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

export const useDataGovernanceStore =
  createPersistentStore<DataGovernanceState>({
    key: DATA_GOVERNANCE_STORAGE_KEY,
    initializer: (set) => ({
      retentionPolicyId: DEFAULT_RETENTION_POLICY_ID,
      historyCaptureEnabled: true,
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
