import type { StateCreator } from "zustand";
import {
  HistoryStoreMachine,
  type HistoryState,
  type HistoryStoreContext,
  type HistoryStoreDependencies,
} from "../historyStoreMachine.ts";

type StoreInitializer = StateCreator<HistoryState>;
type StoreSetter = Parameters<StoreInitializer>[0];
type StoreGetter = Parameters<StoreInitializer>[1];

const createContext = (
  set: StoreSetter,
  get: StoreGetter,
): HistoryStoreContext => ({
  setState: (partial, replace) =>
    set(partial as Parameters<StoreSetter>[0], replace),
  getState: () => get(),
});

const projectMachineState = (machine: HistoryStoreMachine): HistoryState => ({
  ...machine.initialState,
  loadHistory: machine.loadHistory,
  loadMoreHistory: machine.loadMoreHistory,
  addHistory: machine.addHistory,
  clearHistory: machine.clearHistory,
  clearHistoryByLanguage: machine.clearHistoryByLanguage,
  removeHistory: machine.removeHistory,
  favoriteHistory: machine.favoriteHistory,
  unfavoriteHistory: machine.unfavoriteHistory,
  applyRetentionPolicy: machine.applyRetentionPolicy,
});

export const createHistoryStoreInitializer = (
  dependencies: HistoryStoreDependencies,
): StateCreator<HistoryState> => {
  return (set, get) => {
    const context = createContext(set, get);
    const machine = new HistoryStoreMachine(context, dependencies);
    return projectMachineState(machine);
  };
};
