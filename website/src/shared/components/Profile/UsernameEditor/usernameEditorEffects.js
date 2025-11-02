/**
 * 背景：
 *  - UsernameEditor 控制器需要处理两类副作用：同步外部用户名与编辑态聚焦；
 *  - 为降低主 Hook 体量，将副作用拆分为独立工具函数便于复用与测试。
 * 目的：
 *  - 提供可组合的副作用 Hook，保持控制器主体专注于状态与视图模型；
 *  - 确保 lint 迁移后的结构化规则下仍能清晰表达副作用职责。
 * 关键决策与取舍：
 *  - 使用自定义 Hook 包装 useEffect，避免在主控制器内重复样板代码；
 *  - 聚焦于同步用户名与焦点管理，两者属于独立关注点。
 * 影响范围：
 *  - UsernameEditor 控制器 Hook 以及未来可能重用的副作用逻辑。
 * 演进与TODO：
 *  - 后续若接入节流或观测逻辑，可在此文件扩展额外的副作用 Hook。
 */
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
