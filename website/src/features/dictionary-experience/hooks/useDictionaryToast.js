/**
 * 背景：
 *  - 字典体验页的即时反馈目前依赖遮罩弹窗，缺乏轻量的顶部提示来承载成功类消息。
 * 目的：
 *  - 提供一个集中管理 Toast 状态的 Hook，支持按需展示消息并复用既有 Toast 组件。
 * 关键决策与取舍：
 *  - 采用不可变 state 对象并暴露 show/close 操作，避免外部直接修改内部结构；
 *  - 仅存储最小必要字段，其他视觉属性由调用方按需传入，保持扩展弹性。
 * 影响范围：
 *  - 字典体验页及未来复用该 Hook 的功能模块。
 * 演进与TODO：
 *  - 后续可扩展队列或并发策略，支持多个 Toast 排队展示。
 */
import { useCallback, useMemo, useState } from "react";

const DEFAULT_DURATION = 3000;

const INITIAL_STATE = Object.freeze({
  open: false,
  message: "",
  duration: DEFAULT_DURATION,
  backgroundColor: undefined,
  textColor: undefined,
  closeLabel: undefined,
});

const resolveDuration = (candidate, fallback) => {
  if (typeof candidate !== "number") return fallback;
  if (!Number.isFinite(candidate)) return fallback;
  if (candidate <= 0) return fallback;
  return candidate;
};

export function useDictionaryToast({
  defaultDuration = DEFAULT_DURATION,
} = {}) {
  const [state, setState] = useState(INITIAL_STATE);

  const showToast = useCallback(
    (message, options = {}) => {
      if (!message) {
        return;
      }
      setState({
        open: true,
        message,
        duration: resolveDuration(options.duration, defaultDuration),
        backgroundColor: options.backgroundColor,
        textColor: options.textColor,
        closeLabel: options.closeLabel,
      });
    },
    [defaultDuration],
  );

  const closeToast = useCallback(() => {
    setState((current) => ({ ...current, open: false }));
  }, []);

  const toastState = useMemo(
    () => ({
      open: state.open,
      message: state.message,
      duration: state.duration,
      backgroundColor: state.backgroundColor,
      textColor: state.textColor,
      closeLabel: state.closeLabel,
    }),
    [state],
  );

  return { state: toastState, showToast, closeToast };
}
