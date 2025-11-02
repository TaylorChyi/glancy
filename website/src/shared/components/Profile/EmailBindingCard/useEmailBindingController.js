/**
 * 背景：
 *  - 旧版 EmailBindingCard 将状态、副作用与视图耦合在单文件中，导致 lint 拆分迁移迟迟无法收敛。
 * 目的：
 *  - 提供集中管理交互状态的控制器 Hook，产出纯视图模型供 UI 层消费。
 * 关键决策与取舍：
 *  - 复用 useCountdownTimer 统一管理验证码倒计时；
 *  - 借助分层 Hook（状态/归一化/事件）降低主函数体量，满足结构化规则。
 * 影响范围：
 *  - EmailBindingCard 组件的渲染数据来源；
 *  - 单测可针对控制器输出进行断言，降低耦合。
 * 演进与TODO：
 *  - 若后续支持草稿持久化，可在此扩展与本地存储的同步逻辑。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import createEmailBindingViewModel from "./createEmailBindingViewModel.js";
import useCountdownTimer from "./useCountdownTimer.js";

const COUNTDOWN_SECONDS = 60;

const useEmailBindingState = ({ email, mode, resetCountdown }) => {
  const [draftEmail, setDraftEmail] = useState(email ?? "");
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    setDraftEmail(email ?? "");
    if (mode === "idle") {
      setVerificationCode("");
      resetCountdown();
    }
  }, [email, mode, resetCountdown]);

  return { draftEmail, setDraftEmail, verificationCode, setVerificationCode };
};

const useNormalizedValues = (draftEmail, requestedEmail) => {
  const normalizedDraftEmail = useMemo(
    () => draftEmail.trim().toLowerCase(),
    [draftEmail],
  );
  const normalizedRequestedEmail = useMemo(
    () => requestedEmail?.trim().toLowerCase() ?? "",
    [requestedEmail],
  );
  const isVerificationForDraft = useMemo(
    () =>
      normalizedDraftEmail.length > 0 &&
      normalizedRequestedEmail.length > 0 &&
      normalizedDraftEmail === normalizedRequestedEmail,
    [normalizedDraftEmail, normalizedRequestedEmail],
  );

  return {
    normalizedDraftEmail,
    normalizedRequestedEmail,
    isVerificationForDraft,
  };
};

const useEmailBindingHandlers = ({
  draftEmail,
  setDraftEmail,
  verificationCode,
  setVerificationCode,
  onRequestCode,
  onConfirm,
  startCountdown,
}) => {
  const handleDraftEmailChange = useCallback(
    (event) => {
      setDraftEmail(event.target.value);
    },
    [setDraftEmail],
  );

  const handleVerificationCodeChange = useCallback(
    (event) => {
      setVerificationCode(event.target.value);
    },
    [setVerificationCode],
  );

  const handleRequestCode = useCallback(async () => {
    if (typeof onRequestCode !== "function") {
      return;
    }

    const result = await onRequestCode(draftEmail);
    if (result === false) {
      return;
    }

    setVerificationCode("");
    startCountdown();
  }, [draftEmail, onRequestCode, setVerificationCode, startCountdown]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault();
      if (typeof onConfirm !== "function") {
        return;
      }

      await onConfirm({ email: draftEmail, code: verificationCode });
    },
    [draftEmail, onConfirm, verificationCode],
  );

  return {
    handleDraftEmailChange,
    handleVerificationCodeChange,
    handleRequestCode,
    handleSubmit,
  };
};

const computeSubmitDisabled = (
  isVerificationForDraft,
  isAwaitingVerification,
  isVerifying,
) => !isVerificationForDraft || !isAwaitingVerification || isVerifying;

const buildViewModelParams = ({
  email,
  mode,
  isSendingCode,
  isVerifying,
  isUnbinding,
  isAwaitingVerification,
  requestedEmail,
  normalizedRequestedEmail,
  draftEmail,
  verificationCode,
  remainingSeconds,
  isSubmitDisabled,
  isVerificationForDraft,
  onStart,
  onCancel,
  onUnbind,
  t,
  handlers,
}) => ({
  email,
  mode,
  isSendingCode,
  isVerifying,
  isUnbinding,
  isAwaitingVerification,
  requestedEmail,
  normalizedRequestedEmail,
  draftEmail,
  verificationCode,
  remainingSeconds,
  isSubmitDisabled,
  isVerificationForDraft,
  onStart,
  onCancel,
  onRequestCode: handlers.handleRequestCode,
  onConfirm: handlers.handleSubmit,
  onUnbind,
  onDraftEmailChange: handlers.handleDraftEmailChange,
  onVerificationCodeChange: handlers.handleVerificationCodeChange,
  t,
});

export default function useEmailBindingController(props) {
  const {
    email,
    mode,
    isSendingCode,
    isVerifying,
    isUnbinding,
    isAwaitingVerification,
    requestedEmail,
    onStart,
    onCancel,
    onRequestCode,
    onConfirm,
    onUnbind,
    t,
  } = props;

  const countdown = useCountdownTimer(COUNTDOWN_SECONDS);
  const state = useEmailBindingState({
    email,
    mode,
    resetCountdown: countdown.reset,
  });
  const normalized = useNormalizedValues(state.draftEmail, requestedEmail);

  const handlers = useEmailBindingHandlers({
    draftEmail: state.draftEmail,
    setDraftEmail: state.setDraftEmail,
    verificationCode: state.verificationCode,
    setVerificationCode: state.setVerificationCode,
    onRequestCode,
    onConfirm,
    startCountdown: countdown.start,
  });

  const isSubmitDisabled = computeSubmitDisabled(
    normalized.isVerificationForDraft,
    isAwaitingVerification,
    isVerifying,
  );

  return createEmailBindingViewModel(
    buildViewModelParams({
      email,
      mode,
      isSendingCode,
      isVerifying,
      isUnbinding,
      isAwaitingVerification,
      requestedEmail,
      normalizedRequestedEmail: normalized.normalizedRequestedEmail,
      draftEmail: state.draftEmail,
      verificationCode: state.verificationCode,
      remainingSeconds: countdown.remainingSeconds,
      isSubmitDisabled,
      isVerificationForDraft: normalized.isVerificationForDraft,
      onStart,
      onCancel,
      onUnbind,
      t,
      handlers,
    }),
  );
}
