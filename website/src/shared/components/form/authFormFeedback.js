/**
 * 背景：
 *  - AuthForm 需要统一的反馈管道以协调弹窗与 Toast，历史上散落在组件内部不利于复用。
 * 目的：
 *  - 暴露可组合的反馈 Hook，供控制器与其他登录流程共享。
 * 关键决策与取舍：
 *  - 采用简单的 useState 管理状态，后续若需并发支持可接入事件总线；
 *  - 不引入第三方状态库，保持依赖收敛。
 * 影响范围：
 *  - 所有依赖 AuthForm 通知机制的页面与测试。
 * 演进与TODO：
 *  - 可接入埋点或可观测性钩子，以统计通知点击率。
 */
import { useCallback, useState } from "react";
import { useMessagePopup } from "@shared/hooks/useMessagePopup.js";

const useFeedbackChannels = () => {
  const {
    popupConfig,
    popupOpen,
    popupMsg,
    showPopup,
    closePopup,
    resetPopup,
  } = useMessagePopup();
  const [toast, setToast] = useState({ open: false, message: "" });

  const showToast = useCallback((message) => {
    setToast({ open: Boolean(message), message: message ?? "" });
  }, []);

  const resetToast = useCallback(() => {
    setToast({ open: false, message: "" });
  }, []);

  return {
    popup: { open: popupOpen, message: popupMsg },
    toast,
    showPopup,
    showToast,
    resetPopup,
    resetToast,
    closePopup,
    popupConfig,
  };
};

export { useFeedbackChannels };
