import { useContext } from "react";
import KeyboardShortcutContext from "./KeyboardShortcutContext.jsx";

export function useKeyboardShortcutContext() {
  return useContext(KeyboardShortcutContext);
}
