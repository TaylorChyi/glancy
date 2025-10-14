/**
 * 背景：
 *  - TTS 控件（按钮与可点击单词）长期复制 toast/popup/升级模态的状态管理，
 *    错误处理与 UI 容器紧耦合，阻碍新增控件的复用。
 * 目的：
 *  - 抽象统一的播放错误反馈状态机，隔离导航、副作用与 UI 渲染，
 *    便于不同触发器以组合方式复用。
 * 关键决策与取舍：
 *  - 采用组合模式：Hook 负责状态驱动，具体 UI 由独立组件渲染，
 *    相比在控件内硬编码弹层，便于未来新增 TTS 入口直接接入；
 *  - 保留登录重定向逻辑在 Hook 内，避免每个调用方重复依赖路由。
 * 影响范围：
 *  - 所有使用该 Hook 的 TTS 交互控件（当前为按钮与可点击单词）。
 * 演进与TODO：
 *  - TODO：后续可在此注入埋点/日志钩子，或支持自定义错误映射策略。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialFeedbackState = Object.freeze({
  popupMessage: "",
  toastMessage: "",
  upgradeOpen: false,
});

/**
 * 意图：监听 TTS 播放错误并维护反馈层可见性状态。
 * 输入：错误对象（需包含 code 与 message），可选登录跳转路径。
 * 输出：包含弹窗/Toast/升级模态的状态与操作方法。
 * 流程：
 *  1) 401 -> 导航至登录。
 *  2) 403 -> 弹出升级提示。
 *  3) 其他 -> 显示 toast。
 * 错误处理：未知 message 时退化为空字符串，避免渲染 undefined。
 * 复杂度：O(1)。
 */
export default function useTtsFeedback(
  error,
  { loginRedirectPath = "/login" } = {},
) {
  const navigate = useNavigate();
  const [state, setState] = useState(initialFeedbackState);

  useEffect(() => {
    if (!error) {
      return;
    }
    const message = typeof error.message === "string" ? error.message : "";

    switch (error.code) {
      case 401: {
        if (loginRedirectPath) {
          navigate(loginRedirectPath);
        }
        break;
      }
      case 403: {
        setState((prev) => ({
          ...prev,
          popupMessage: message,
        }));
        break;
      }
      default: {
        setState((prev) => ({
          ...prev,
          toastMessage: message,
        }));
        break;
      }
    }
  }, [error, loginRedirectPath, navigate]);

  const closePopup = useCallback(() => {
    setState((prev) => ({ ...prev, popupMessage: "" }));
  }, []);

  const closeToast = useCallback(() => {
    setState((prev) => ({ ...prev, toastMessage: "" }));
  }, []);

  const openUpgrade = useCallback(() => {
    setState((prev) => ({
      ...prev,
      popupMessage: "",
      upgradeOpen: true,
    }));
  }, []);

  const closeUpgrade = useCallback(() => {
    setState((prev) => ({ ...prev, upgradeOpen: false }));
  }, []);

  return useMemo(
    () => ({
      popupMessage: state.popupMessage,
      toastMessage: state.toastMessage,
      isPopupOpen: Boolean(state.popupMessage),
      isToastOpen: Boolean(state.toastMessage),
      isUpgradeOpen: state.upgradeOpen,
      closePopup,
      closeToast,
      openUpgrade,
      closeUpgrade,
    }),
    [
      state.popupMessage,
      state.toastMessage,
      state.upgradeOpen,
      closePopup,
      closeToast,
      openUpgrade,
      closeUpgrade,
    ],
  );
}
