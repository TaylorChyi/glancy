import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import PropTypes from "prop-types";
import { useKeyboardShortcutsApi } from "@shared/api/keyboardShortcuts.js";
import { useUser } from "@core/context/AppContext.jsx";
import {
  mergeShortcutLists,
  DEFAULT_SHORTCUTS,
} from "@shared/utils/keyboardShortcuts.js";
import { KEYBOARD_SHORTCUT_RESET_ACTION } from "./keyboardShortcutContextTokens.js";
import { KEYBOARD_SHORTCUT_ACTIONS } from "./keyboardShortcutActions.js";
import {
  createKeyboardShortcutState,
  reduceKeyboardShortcutState,
} from "./stateSlices/keyboardShortcuts/index.js";

const KeyboardShortcutContext = createContext({
  shortcuts: [],
  status: "idle",
  errors: {},
  pendingAction: null,
  load: () => Promise.resolve(),
  updateShortcut: () => Promise.resolve(),
  resetShortcuts: () => Promise.resolve(),
});

const buildDefaultShortcuts = () =>
  DEFAULT_SHORTCUTS.map((shortcut) => ({
    action: shortcut.action,
    keys: [...shortcut.keys],
    defaultKeys: [...shortcut.defaultKeys],
  }));

const useKeyboardShortcutReducer = () =>
  useReducer(
    reduceKeyboardShortcutState,
    createKeyboardShortcutState(buildDefaultShortcuts()),
  );

const useKeyboardShortcutLoader = (api, token, userId, dispatch) => {
  const load = useCallback(async () => {
    if (!userId || !token) {
      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.RESET,
        payload: buildDefaultShortcuts(),
      });
      return;
    }

    dispatch({ type: KEYBOARD_SHORTCUT_ACTIONS.LOAD_START });
    try {
      const response = await api.fetchShortcuts({ token });
      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.LOAD_SUCCESS,
        payload: mergeShortcutLists(response?.shortcuts),
      });
    } catch (error) {
      console.error("[shortcuts] failed to load", error);
      const message = error?.message ?? "Failed to load shortcuts";
      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.LOAD_FAILURE,
        error: message,
      });
    }
  }, [api, dispatch, token, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return load;
};

const useKeyboardShortcutUpdater = (api, token, userId, dispatch) =>
  useCallback(
    async (action, keys) => {
      if (!userId || !token) {
        return;
      }

      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START,
        action,
      });

      try {
        const response = await api.updateShortcut({ action, keys, token });
        dispatch({
          type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS,
          action,
          payload: mergeShortcutLists(response?.shortcuts),
        });
      } catch (error) {
        console.error(`[shortcuts] failed to update ${action}`, error);
        const message = error?.message ?? "Failed to update shortcut";
        dispatch({
          type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE,
          action,
          errorMessage: message,
        });
        throw error;
      }
    },
    [api, dispatch, token, userId],
  );

const useKeyboardShortcutResetter = (api, token, userId, dispatch) =>
  useCallback(async () => {
    if (!userId || !token) {
      return;
    }

    dispatch({
      type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_START,
      action: KEYBOARD_SHORTCUT_RESET_ACTION,
    });

    try {
      const response = await api.resetShortcuts({ token });
      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_SUCCESS,
        action: KEYBOARD_SHORTCUT_RESET_ACTION,
        payload: mergeShortcutLists(response?.shortcuts),
      });
    } catch (error) {
      console.error("[shortcuts] failed to reset", error);
      const message = error?.message ?? "Failed to reset shortcuts";
      dispatch({
        type: KEYBOARD_SHORTCUT_ACTIONS.UPDATE_FAILURE,
        action: KEYBOARD_SHORTCUT_RESET_ACTION,
        errorMessage: message,
      });
      throw error;
    }
  }, [api, dispatch, token, userId]);

const useKeyboardShortcutDerivedState = (state) =>
  useMemo(
    () => ({
      shortcuts: state.shortcuts.list,
      status: state.bindings.status,
      errors: state.conflicts.errors,
      pendingAction: state.bindings.pendingAction,
      lastError: state.conflicts.lastError,
    }),
    [state],
  );

const useKeyboardShortcutContextValue = (api, token, userId) => {
  const [state, dispatch] = useKeyboardShortcutReducer();
  const load = useKeyboardShortcutLoader(api, token, userId, dispatch);
  const updateShortcut = useKeyboardShortcutUpdater(
    api,
    token,
    userId,
    dispatch,
  );
  const resetShortcuts = useKeyboardShortcutResetter(
    api,
    token,
    userId,
    dispatch,
  );
  const derivedState = useKeyboardShortcutDerivedState(state);

  return useMemo(
    () => ({
      shortcuts: derivedState.shortcuts,
      status: derivedState.status,
      errors: derivedState.errors,
      pendingAction: derivedState.pendingAction,
      lastError: derivedState.lastError,
      load,
      updateShortcut,
      resetShortcuts,
    }),
    [derivedState, load, resetShortcuts, updateShortcut],
  );
};

export function KeyboardShortcutProvider({ children }) {
  const api = useKeyboardShortcutsApi();
  const { user } = useUser();
  const value = useKeyboardShortcutContextValue(
    api,
    user?.token,
    user?.id,
  );

  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}

KeyboardShortcutProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default KeyboardShortcutContext;
