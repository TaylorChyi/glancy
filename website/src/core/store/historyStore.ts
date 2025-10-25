/**
 * 背景：
 *  - 历史记录 Store 过往同时承载分页、缓存同步、错误处理等多重逻辑，
 *    逻辑散落导致演进时易产生冲突与遗漏依赖。
 * 目的：
 *  - 将业务编排委托给 HistoryStoreMachine，Store 仅负责装配依赖与持久化配置，
 *    让业务定义集中、边界清晰。
 * 关键决策与取舍：
 *  - 采用端口-适配器思路注入 API、词条缓存、治理与用户依赖，便于后续替换实现；
 *  - 保留原有迁移逻辑以兼容历史持久化数据，避免一次性脚本。
 * 影响范围：
 *  - 所有依赖 useHistoryStore 的功能模块；
 *  - 数据治理、词条缓存与用户状态在装配层重新编排。
 * 演进与TODO：
 *  - TODO: 将 Gateway 抽离到 @core/services 目录，支撑多端共享；
 *  - TODO: 若引入服务端推送，可在状态机内增加订阅入口以减少轮询。
 */

import api from "@shared/api/index.js";
import { createPersistentStore } from "./createPersistentStore.js";
import { pickState } from "./persistUtils.js";
import { useWordStore } from "./wordStore.js";
import { useDataGovernanceStore } from "./dataGovernanceStore.js";
import { useUserStore } from "./userStore.js";
import type { HistoryItem } from "@core/history/index.ts";
import {
  createTermKey,
  normalizeFlavor,
  normalizeLanguage,
} from "@core/history/index.ts";
import {
  HistoryStoreMachine,
  type HistoryApiGateway,
  type HistoryState,
} from "./history/historyStoreMachine.ts";

export type { HistoryState } from "./history/historyStoreMachine.ts";

const historyApiGateway: HistoryApiGateway = {
  fetchPage: (params) => api.searchRecords.fetchSearchRecords(params),
  saveRecord: (params) => api.searchRecords.saveSearchRecord(params),
  clearRecords: (params) => api.searchRecords.clearSearchRecords(params),
  deleteRecord: (params) => api.searchRecords.deleteSearchRecord(params),
};

export const useHistoryStore = createPersistentStore<HistoryState>({
  key: "searchHistory",
  initializer: (set, get) => {
    const machine = new HistoryStoreMachine(
      {
        setState: (partial, replace) =>
          set(partial as Parameters<typeof set>[0], replace),
        getState: () => get(),
      },
      {
        api: historyApiGateway,
        wordStore: useWordStore,
        dataGovernance: {
          isCaptureEnabled: () =>
            useDataGovernanceStore.getState().historyCaptureEnabled,
        },
        user: {
          clearUser: () => useUserStore.getState().clearUser(),
        },
      },
    );

    return {
      ...machine.initialState,
      loadHistory: machine.loadHistory,
      loadMoreHistory: machine.loadMoreHistory,
      addHistory: machine.addHistory,
      clearHistory: machine.clearHistory,
      clearHistoryByLanguage: machine.clearHistoryByLanguage,
      removeHistory: machine.removeHistory,
      applyRetentionPolicy: machine.applyRetentionPolicy,
    } satisfies HistoryState;
  },
  persistOptions: {
    partialize: pickState(["history"]),
    version: 3,
    migrate: (persistedState, version) => {
      if (!persistedState) return persistedState;
      let nextState = persistedState;
      if (version === undefined || version < 2) {
        const legacy = Array.isArray(nextState.history)
          ? nextState.history
          : [];
        const upgraded = legacy.map((item) => {
          if (typeof item === "string") {
            const language = normalizeLanguage(item);
            const flavor = normalizeFlavor();
            return {
              term: item,
              language,
              flavor,
              termKey: createTermKey(item, language, flavor),
              createdAt: null,
              versions: [],
              latestVersionId: null,
            } satisfies HistoryItem;
          }
          if (item && typeof item === "object") {
            const language = normalizeLanguage(item.term, item.language);
            const flavor = normalizeFlavor(
              "flavor" in item ? item.flavor : undefined,
            );
            return {
              ...item,
              language,
              flavor,
              termKey: createTermKey(item.term, language, flavor),
            } as HistoryItem;
          }
          return item;
        });
        nextState = { ...nextState, history: upgraded };
      }
      if (version !== undefined && version < 3) {
        const upgraded = Array.isArray(nextState.history)
          ? nextState.history.map((item: any) => {
              if (!item || typeof item !== "object") {
                return item;
              }
              const language = normalizeLanguage(item.term, item.language);
              const flavor = normalizeFlavor(item.flavor);
              return {
                ...item,
                language,
                flavor,
                termKey: createTermKey(item.term, language, flavor),
              } as HistoryItem;
            })
          : [];
        nextState = { ...nextState, history: upgraded };
      }
      if (Array.isArray(nextState.history)) {
        const normalized = nextState.history.map((item: any) => {
          if (!item || typeof item !== "object") {
            return item;
          }
          const recordId = item.recordId == null ? null : String(item.recordId);
          return { ...item, recordId } as HistoryItem;
        });
        nextState = { ...nextState, history: normalized };
      }
      return nextState;
    },
  },
});
