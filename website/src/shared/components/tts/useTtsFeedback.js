import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialFeedbackState = Object.freeze({
  popupMessage: "",
  toastMessage: "",
  upgradeOpen: false,
});

function useFeedbackState() {
  const [state, setState] = useState(initialFeedbackState);

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

  const setPopupMessage = useCallback((message) => {
    setState((prev) => ({ ...prev, popupMessage: message }));
  }, []);

  const setToastMessage = useCallback((message) => {
    setState((prev) => ({ ...prev, toastMessage: message }));
  }, []);

  return {
    state,
    closePopup,
    closeToast,
    openUpgrade,
    closeUpgrade,
    setPopupMessage,
    setToastMessage,
  };
}

function useFeedbackErrorEffect(error, loginRedirectPath, navigate, actions) {
  const { setPopupMessage, setToastMessage } = actions;

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
        setPopupMessage(message);
        break;
      }
      default: {
        setToastMessage(message);
        break;
      }
    }
  }, [
    error,
    loginRedirectPath,
    navigate,
    setPopupMessage,
    setToastMessage,
  ]);
}

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
  const {
    state: { popupMessage, toastMessage, upgradeOpen },
    closePopup,
    closeToast,
    openUpgrade,
    closeUpgrade,
    setPopupMessage,
    setToastMessage,
  } = useFeedbackState();
  useFeedbackErrorEffect(error, loginRedirectPath, navigate, {
    setPopupMessage,
    setToastMessage,
  });
  return useMemo(
    () => ({
      popupMessage,
      toastMessage,
      isPopupOpen: Boolean(popupMessage),
      isToastOpen: Boolean(toastMessage),
      isUpgradeOpen: upgradeOpen,
      closePopup,
      closeToast,
      openUpgrade,
      closeUpgrade,
    }),
    [popupMessage, toastMessage, upgradeOpen, closePopup, closeToast, openUpgrade, closeUpgrade],
  );
}
