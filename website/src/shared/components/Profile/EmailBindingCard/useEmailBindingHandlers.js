import { useMemo } from "react";
import useDraftEmailHandler from "./useDraftEmailHandler.js";
import useEmailSubmitHandler from "./useEmailSubmitHandler.js";
import useVerificationHandlers from "./useVerificationHandlers.js";

const useDraftEmailChange = (setDraftEmail) =>
  useDraftEmailHandler(setDraftEmail);

const useVerificationHandlerSet = ({
  draftEmail,
  setVerificationCode,
  onRequestCode,
  startCountdown,
}) =>
  useVerificationHandlers({
    draftEmail,
    setVerificationCode,
    onRequestCode,
    startCountdown,
  });

const useSubmitHandler = ({ draftEmail, verificationCode, onConfirm }) =>
  useEmailSubmitHandler({
    draftEmail,
    verificationCode,
    onConfirm,
  });

const composeHandlers = ({
  handleDraftEmailChange,
  handleVerificationCodeChange,
  handleRequestCode,
  handleSubmit,
}) => ({
  handleDraftEmailChange,
  handleVerificationCodeChange,
  handleRequestCode,
  handleSubmit,
});

const useMemoizedHandlers = ({
  handleDraftEmailChange,
  handleVerificationCodeChange,
  handleRequestCode,
  handleSubmit,
}) =>
  useMemo(
    () =>
      composeHandlers({
        handleDraftEmailChange,
        handleVerificationCodeChange,
        handleRequestCode,
        handleSubmit,
      }),
    [
      handleDraftEmailChange,
      handleVerificationCodeChange,
      handleRequestCode,
      handleSubmit,
    ],
  );

const useEmailBindingHandlers = ({
  draftEmail,
  setDraftEmail,
  verificationCode,
  setVerificationCode,
  onRequestCode,
  onConfirm,
  startCountdown,
}) => {
  const handleDraftEmailChange = useDraftEmailChange(setDraftEmail);
  const { handleVerificationCodeChange, handleRequestCode } =
    useVerificationHandlerSet({
      draftEmail,
      setVerificationCode,
      onRequestCode,
      startCountdown,
    });
  const handleSubmit = useSubmitHandler({
    draftEmail,
    verificationCode,
    onConfirm,
  });

  return useMemoizedHandlers({
    handleDraftEmailChange,
    handleVerificationCodeChange,
    handleRequestCode,
    handleSubmit,
  });
};

export default useEmailBindingHandlers;
export { useEmailBindingHandlers };
