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
  useCallback(async () => {
    await runWithPending(ACTION_CLEAR_ALL, () => clearHistory(user));
  }, [clearHistory, runWithPending, user]);

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

const isBrowserRuntime = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const resolveDictionaryEntry = (dictionaryState, item) => {
  if (!item?.termKey) {
    return undefined;
  }
  return dictionaryState.getEntry(
    item.termKey,
    item.latestVersionId ?? undefined,
  );
};

const createCsvFromHistory = ({ history, translations }) => {
  const dictionaryState = useWordStore.getState();
  return serializeHistoryToCsv({
    history,
    translations,
    resolveEntry: (item) => resolveDictionaryEntry(dictionaryState, item),
  });
};

const createCsvBlob = (csv) =>
  new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });

const createDownloadFileName = (fileName) =>
  `${fileName}-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;

const createDownloadAnchor = (url, fileName) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = createDownloadFileName(fileName);
  anchor.rel = "noopener";
  return anchor;
};

const triggerDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const anchor = createDownloadAnchor(url, fileName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const useExportHandler = ({ history, translations, fileName }) =>
  useCallback(() => {
    if (!isBrowserRuntime()) {
      return;
    }
    try {
      const csv = createCsvFromHistory({ history, translations });
      const blob = createCsvBlob(csv);
      triggerDownload(blob, fileName);
    } catch (error) {
      console.error("[DataSection] export failed", error);
    }
  }, [fileName, history, translations]);
