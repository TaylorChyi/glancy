import type { StateCreator } from "zustand";
import {
  DEFAULT_SETTINGS_SLICE,
  type SettingsSlice,
  type SettingsState,
} from "../model.js";
import { resolveInitialSystemLanguage } from "../persistence.js";
import { createSettingsActions } from "./actions.js";

const buildInitialSlice = (
  storage: Storage | undefined,
): SettingsSlice => ({
  ...DEFAULT_SETTINGS_SLICE,
  systemLanguage: storage
    ? resolveInitialSystemLanguage(storage)
    : DEFAULT_SETTINGS_SLICE.systemLanguage,
});

export const createSettingsStoreInitializer = (
  storage: Storage | undefined,
): StateCreator<SettingsState> => {
  return (set, get) => {
    const initialSlice = buildInitialSlice(storage);
    const actions = createSettingsActions(storage, set, get);
    return {
      ...initialSlice,
      ...actions,
    } satisfies SettingsState;
  };
};
