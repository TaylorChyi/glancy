/**
 * 背景：
 *  - DataSection 需协调多种动作（保留策略、清理、导出），原逻辑在控制器中手写回调，
 *    既冗长又不易测试。
 * 目的：
 *  - 抽离动作相关 Hook，形成明确的依赖接口，方便复用与单测。
 * 关键决策与取舍：
 *  - 继续使用 useCallback 保持回调稳定性；
 *  - 导出操作延续浏览器 Blob 方案，等待服务端能力接入后再替换；
 *  - 选项生成逻辑与动作一并集中，便于未来按需拆分策略。
 * 影响范围：
 *  - 偏好设置数据分区的行为处理；
 *  - 可为 SettingsModal 等复用场景提供统一动作实现。
 * 演进与TODO：
 *  - TODO: 接入埋点后，可在此统一记录用户操作事件。
 */

import { useCallback, useMemo } from "react";
import { useWordStore } from "@core/store/wordStore.js";
import {
  DATA_RETENTION_POLICIES,
  getRetentionPolicyById,
} from "@core/store/dataGovernanceStore";
import {
  normalizeLanguageValue,
  serializeHistoryToCsv,
} from "./dataSectionToolkit.js";

export const ACTION_RETENTION = "retention";
export const ACTION_CLEAR_ALL = "clear-all";
export const ACTION_CLEAR_LANGUAGE = "clear-language";

export const useHistoryToggleOptions = (toggleCopy) =>
  useMemo(
    () => [
      { id: "history-on", value: true, label: toggleCopy.onLabel },
      { id: "history-off", value: false, label: toggleCopy.offLabel },
    ],
    [toggleCopy.offLabel, toggleCopy.onLabel],
  );

export const useRetentionOptions = (translations) =>
  useMemo(
    () =>
      DATA_RETENTION_POLICIES.map((policy) => ({
        ...policy,
        id: policy.id,
        value: policy.id,
        label:
          translations[`settingsDataRetentionOption_${policy.id}`] ||
          `${policy.days ?? "∞"} days`,
      })),
    [translations],
  );

export const useRetentionHandler = ({
  setRetentionPolicy,
  applyRetentionPolicy,
  runWithPending,
  user,
}) =>
  useCallback(
    async (policyId) => {
      setRetentionPolicy(policyId);
      const policy = getRetentionPolicyById(policyId);
      if (!policy || policy.days == null) {
        return;
      }
      await runWithPending(ACTION_RETENTION, () =>
        applyRetentionPolicy(policy.days, user),
      );
    },
    [applyRetentionPolicy, runWithPending, setRetentionPolicy, user],
  );

export const useClearAllHandler = ({ clearHistory, runWithPending, user }) =>
  useCallback(
    async () => {
      await runWithPending(ACTION_CLEAR_ALL, () => clearHistory(user));
    },
    [clearHistory, runWithPending, user],
  );

export const useClearLanguageHandler = ({
  clearHistoryByLanguage,
  language,
  runWithPending,
  user,
}) =>
  useCallback(async () => {
    const normalized = normalizeLanguageValue(language);
    if (!normalized) {
      return;
    }
    await runWithPending(ACTION_CLEAR_LANGUAGE, () =>
      clearHistoryByLanguage(normalized, user),
    );
  }, [clearHistoryByLanguage, language, runWithPending, user]);

export const useExportHandler = ({ history, translations, fileName }) =>
  useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    try {
      const dictionaryState = useWordStore.getState();
      const csv = serializeHistoryToCsv({
        history,
        translations,
        resolveEntry: (item) => {
          if (!item?.termKey) {
            return undefined;
          }
          return dictionaryState.getEntry(
            item.termKey,
            item.latestVersionId ?? undefined,
          );
        },
      });
      const blob = new Blob([`\ufeff${csv}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      anchor.href = url;
      anchor.download = `${fileName}-${timestamp}.csv`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("[DataSection] export failed", error);
    }
  }, [fileName, history, translations]);
