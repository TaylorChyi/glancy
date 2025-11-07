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
