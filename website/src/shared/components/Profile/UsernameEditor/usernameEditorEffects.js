import { useEffect, useRef } from "react";
import {
  UsernameEditorActions,
  UsernameEditorModes,
} from "./usernameEditorState.js";

/**
 * 意图：当外部用户名变更时，同步更新状态机并重置草稿。
 */
export const useUsernameSynchronization = (username, dispatch) => {
  useEffect(() => {
    dispatch({
      type: UsernameEditorActions.SYNC_VALUE,
      value: username ?? "",
    });
  }, [dispatch, username]);
};

/**
 * 意图：在进入编辑态时自动聚焦并选中文本，提升可用性。
 */
export const useEditFocusManagement = (mode, inputRef) => {
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (mode === UsernameEditorModes.EDIT && previousModeRef.current !== mode) {
      const node = inputRef.current;
      if (node) {
        node.focus();
        node.select();
      }
    }
    previousModeRef.current = mode;
  }, [mode, inputRef]);
};
