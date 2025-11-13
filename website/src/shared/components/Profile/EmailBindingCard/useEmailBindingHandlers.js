import useDraftEmailHandler from "./useDraftEmailHandler.js";
import useEmailSubmitHandler from "./useEmailSubmitHandler.js";
import useVerificationHandlers from "./useVerificationHandlers.js";

const useEmailBindingHandlers = ({
  draftEmail,
  setDraftEmail,
  verificationCode,
  setVerificationCode,
  onRequestCode,
  onConfirm,
  startCountdown,
}) => {
  const handleDraftEmailChange = useDraftEmailHandler(setDraftEmail);
  const { handleVerificationCodeChange, handleRequestCode } =
    useVerificationHandlers({
      draftEmail,
      setVerificationCode,
      onRequestCode,
      startCountdown,
    });
  const handleSubmit = useEmailSubmitHandler({
    draftEmail,
    verificationCode,
    onConfirm,
  });

  return {
    handleDraftEmailChange,
    handleVerificationCodeChange,
    handleRequestCode,
    handleSubmit,
  };
};

export default useEmailBindingHandlers;
export { useEmailBindingHandlers };
