/**
 * 背景：
 *  - 各页面通过本地 useState 管理 MessagePopup 状态，开关逻辑重复且分散，
 *    不利于后续统一扩展关闭策略或埋点。
 * 目的：
 *  - 提供跨层可复用的弹窗状态 Hook，集中封装打开、关闭与重置行为，
 *    让调用方聚焦业务语义。
 * 关键决策与取舍：
 *  - 暂不引入全局事件总线，保持轻量且贴近现有调用方式；
 *  - 支持以空消息重置状态，兼容现有调用中以空字符串关闭弹窗的约定。
 * 影响范围：
 *  - Profile、Dictionary 等页面将复用该 Hook，后续如需扩展更多属性可在此集中演进。
 * 演进与TODO：
 *  - TODO: 若未来需要统计弹窗曝光，可在此注入打点或观察回调。
 */
import { useCallback, useMemo, useState } from "react";

function createPopupState(message) {
  const normalizedMessage = message ?? "";
  return {
    open: Boolean(normalizedMessage),
    message: normalizedMessage,
  };
}

export function useMessagePopup(initialMessage = "") {
  const [state, setState] = useState(() => createPopupState(initialMessage));

  const showPopup = useCallback((message) => {
    const nextMessage = message ?? "";
    if (!nextMessage) {
      setState(createPopupState(""));
      return;
    }
    setState({ open: true, message: nextMessage });
  }, []);

  const closePopup = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const resetPopup = useCallback(() => {
    setState(createPopupState(""));
  }, []);

  const popupConfig = useMemo(
    () => ({
      open: state.open,
      message: state.message,
      onClose: closePopup,
    }),
    [closePopup, state.message, state.open],
  );

  return {
    popupOpen: state.open,
    popupMsg: state.message,
    showPopup,
    closePopup,
    resetPopup,
    popupConfig,
  };
}
