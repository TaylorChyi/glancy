/**
 * 背景：
 *  - 词典体验底部面板需要在搜索输入与释义操作之间切换，原实现分散在视图组件中，状态难以追踪。
 * 目的：
 *  - 以单一 Hook 封装面板状态机，集中管理显隐条件与外部事件（焦点、滚动）的响应，便于复用与测试。
 * 关键决策与取舍：
 *  - 采用有限状态模式，仅维护 "search" 与 "actions" 两种模式，配合显式的事件处理函数，保持可预测性。
 *  - 放弃在组件外部直接写 DOM，所有外部驱动（滚动/聚焦）通过语义化回调进入，保障抽象清晰。
 * 影响范围：
 *  - DictionaryExperience 底部面板的渲染逻辑与相关测试策略。
 * 演进与TODO：
 *  - 若后续需要新增模式（如语音录制面板），可在此扩展枚举与转换图并补充测试。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const PANEL_MODE_SEARCH = "search" as const;
export const PANEL_MODE_ACTIONS = "actions" as const;

type PanelMode = typeof PANEL_MODE_SEARCH | typeof PANEL_MODE_ACTIONS;

type UseBottomPanelStateParams = {
  hasDefinition: boolean;
  text: string;
};

type UseBottomPanelStateResult = {
  mode: PanelMode;
  isSearchMode: boolean;
  isActionsMode: boolean;
  handleFocusChange: (focused: boolean) => void;
  activateSearchMode: () => void;
  activateActionsMode: () => void;
  handleScrollEscape: () => void;
};

const trimText = (value: string): string => value.trim();

export default function useBottomPanelState({
  hasDefinition,
  text,
}: UseBottomPanelStateParams): UseBottomPanelStateResult {
  const [mode, setMode] = useState<PanelMode>(PANEL_MODE_SEARCH);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const latestHasDefinition = useRef(hasDefinition);

  useEffect(() => {
    latestHasDefinition.current = hasDefinition;
  }, [hasDefinition]);

  const evaluateActionsFallback = useCallback(() => {
    if (!latestHasDefinition.current) {
      return;
    }
    setMode(PANEL_MODE_ACTIONS);
    setIsInputFocused(false);
  }, []);

  const handleFocusChange = useCallback(
    (focused: boolean) => {
      setIsInputFocused(focused);
      if (focused) {
        setMode(PANEL_MODE_SEARCH);
        return;
      }
      evaluateActionsFallback();
    },
    [evaluateActionsFallback],
  );

  const activateSearchMode = useCallback(() => {
    setMode(PANEL_MODE_SEARCH);
  }, []);

  const activateActionsMode = useCallback(() => {
    evaluateActionsFallback();
  }, [evaluateActionsFallback]);

  const handleScrollEscape = useCallback(() => {
    evaluateActionsFallback();
  }, [evaluateActionsFallback]);

  const normalizedText = useMemo(() => trimText(text), [text]);

  useEffect(() => {
    if (!hasDefinition) {
      setMode(PANEL_MODE_SEARCH);
      return;
    }
    if (!isInputFocused && normalizedText.length === 0) {
      setMode(PANEL_MODE_ACTIONS);
    }
  }, [hasDefinition, isInputFocused, normalizedText]);

  return {
    mode,
    isSearchMode: mode === PANEL_MODE_SEARCH,
    isActionsMode: mode === PANEL_MODE_ACTIONS,
    handleFocusChange,
    activateSearchMode,
    activateActionsMode,
    handleScrollEscape,
  };
}
