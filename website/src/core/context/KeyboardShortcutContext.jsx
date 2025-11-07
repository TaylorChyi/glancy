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

const KeyboardShortcutContext = createContext({
  shortcuts: [],
  status: "idle",
  errors: {},
  pendingAction: null,
  load: () => Promise.resolve(),
  updateShortcut: () => Promise.resolve(),
  resetShortcuts: () => Promise.resolve(),
});

const ACTIONS = {
  RESET: "reset",
  LOAD_START: "load_start",
  LOAD_SUCCESS: "load_success",
  LOAD_FAILURE: "load_failure",
  UPDATE_START: "update_start",
  UPDATE_SUCCESS: "update_success",
  UPDATE_FAILURE: "update_failure",
};

const initialState = {
  shortcuts: [],
  status: "idle",
  errors: {},
  pendingAction: null,
  lastError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.RESET:
      return { ...initialState };
    case ACTIONS.LOAD_START:
      return {
        ...state,
        status: "loading",
        lastError: null,
        errors: {},
        pendingAction: null,
      };
    case ACTIONS.LOAD_SUCCESS:
      return {
        ...state,
        status: "ready",
        shortcuts: action.payload,
        errors: {},
        lastError: null,
        pendingAction: null,
      };
    case ACTIONS.LOAD_FAILURE:
      return {
        ...state,
        status: "error",
        lastError: action.error,
        pendingAction: null,
      };
    case ACTIONS.UPDATE_START: {
      const nextErrors =
        typeof action.action === "string"
          ? { ...state.errors, [action.action]: null }
          : state.errors;
      return {
        ...state,
        pendingAction: action.action,
        errors: nextErrors,
        lastError: null,
      };
    }
    case ACTIONS.UPDATE_SUCCESS: {
      const nextErrors =
        typeof action.action === "string"
          ? { ...state.errors, [action.action]: null }
          : state.errors;
      return {
        ...state,
        shortcuts: action.payload,
        pendingAction: null,
        errors: nextErrors,
        lastError: null,
      };
    }
    case ACTIONS.UPDATE_FAILURE: {
      const nextErrors =
        typeof action.action === "string"
          ? { ...state.errors, [action.action]: action.errorMessage }
          : state.errors;
      return {
        ...state,
        pendingAction: null,
        errors: nextErrors,
        lastError: action.errorMessage,
      };
    }
    default:
      return state;
  }
}

export function KeyboardShortcutProvider({ children }) {
  const api = useKeyboardShortcutsApi();
  const { user } = useUser();
  const token = user?.token;
  const userId = user?.id;
  const [state, dispatch] = useReducer(reducer, initialState, (state) => ({
    ...state,
    shortcuts: DEFAULT_SHORTCUTS.map((shortcut) => ({
      action: shortcut.action,
      keys: [...shortcut.keys],
      defaultKeys: [...shortcut.defaultKeys],
    })),
  }));

  const load = useCallback(async () => {
    if (!userId || !token) {
      dispatch({ type: ACTIONS.RESET });
      return;
    }
    dispatch({ type: ACTIONS.LOAD_START });
    try {
      const response = await api.fetchShortcuts({ token });
      dispatch({
        type: ACTIONS.LOAD_SUCCESS,
        payload: mergeShortcutLists(response?.shortcuts),
      });
    } catch (error) {
      console.error("[shortcuts] failed to load", error);
      const message = error?.message ?? "Failed to load shortcuts";
      dispatch({ type: ACTIONS.LOAD_FAILURE, error: message });
    }
  }, [api, token, userId]);

  useEffect(() => {
    if (!userId || !token) {
      dispatch({ type: ACTIONS.RESET });
      return;
    }
    load();
  }, [load, token, userId]);

  const updateShortcut = useCallback(
    async (action, keys) => {
      if (!userId || !token) {
        return;
      }
      dispatch({ type: ACTIONS.UPDATE_START, action });
      try {
        const response = await api.updateShortcut({ action, keys, token });
        dispatch({
          type: ACTIONS.UPDATE_SUCCESS,
          action,
          payload: mergeShortcutLists(response?.shortcuts),
        });
      } catch (error) {
        console.error(`[shortcuts] failed to update ${action}`, error);
        const message = error?.message ?? "Failed to update shortcut";
        dispatch({
          type: ACTIONS.UPDATE_FAILURE,
          action,
          errorMessage: message,
        });
        throw error;
      }
    },
    [api, token, userId],
  );

  const resetShortcuts = useCallback(async () => {
    if (!userId || !token) {
      return;
    }
    dispatch({
      type: ACTIONS.UPDATE_START,
      action: KEYBOARD_SHORTCUT_RESET_ACTION,
    });
    try {
      const response = await api.resetShortcuts({ token });
      dispatch({
        type: ACTIONS.UPDATE_SUCCESS,
        action: KEYBOARD_SHORTCUT_RESET_ACTION,
        payload: mergeShortcutLists(response?.shortcuts),
      });
    } catch (error) {
      console.error("[shortcuts] failed to reset", error);
      const message = error?.message ?? "Failed to reset shortcuts";
      dispatch({
        type: ACTIONS.UPDATE_FAILURE,
        action: KEYBOARD_SHORTCUT_RESET_ACTION,
        errorMessage: message,
      });
      throw error;
    }
  }, [api, token, userId]);

  const value = useMemo(
    () => ({
      shortcuts: state.shortcuts,
      status: state.status,
      errors: state.errors,
      pendingAction: state.pendingAction,
      lastError: state.lastError,
      load,
      updateShortcut,
      resetShortcuts,
    }),
    [state, load, updateShortcut, resetShortcuts],
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
