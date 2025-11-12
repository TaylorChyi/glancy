import {
  shortcutsReducer,
  shortcutsInitialState,
  createShortcutsState,
} from "./shortcutsSlice.js";
import {
  bindingsReducer,
  bindingsInitialState,
} from "./bindingsSlice.js";
import {
  conflictsReducer,
  conflictsInitialState,
} from "./conflictsSlice.js";

const reducers = {
  shortcuts: shortcutsReducer,
  bindings: bindingsReducer,
  conflicts: conflictsReducer,
};

export const keyboardShortcutInitialState = {
  shortcuts: shortcutsInitialState,
  bindings: bindingsInitialState,
  conflicts: conflictsInitialState,
};

export function createKeyboardShortcutState(shortcuts = []) {
  return {
    shortcuts: createShortcutsState(shortcuts),
    bindings: bindingsInitialState,
    conflicts: conflictsInitialState,
  };
}

export function reduceKeyboardShortcutState(
  state = keyboardShortcutInitialState,
  action,
) {
  let hasChanged = false;
  const nextState = {};
  for (const [key, reducer] of Object.entries(reducers)) {
    const currentSlice = state[key];
    const nextSlice = reducer(currentSlice, action);
    nextState[key] = nextSlice;
    if (nextSlice !== currentSlice) {
      hasChanged = true;
    }
  }
  return hasChanged ? nextState : state;
}
