import { useCallback, useMemo } from "react";

const noop = () => {};

export const useResponseStyleSectionHandlers = ({
  onRetry,
  onFieldChange,
  onFieldCommit,
}) => {
  const handleRetry = useCallback(() => {
    typeof onRetry === "function" && onRetry();
  }, [onRetry]);
  const handleChange = useCallback((fieldId, value) => {
    typeof onFieldChange === "function" && onFieldChange(fieldId, value);
  }, [onFieldChange]);
  const handleCommit = useCallback((fieldId) => {
    typeof onFieldCommit === "function" && onFieldCommit(fieldId);
  }, [onFieldCommit]);
  return useMemo(
    () => ({
      onRetry: typeof onRetry === "function" ? handleRetry : undefined,
      onFieldChange: typeof onFieldChange === "function" ? handleChange : noop,
      onFieldCommit: typeof onFieldCommit === "function" ? handleCommit : noop,
    }),
    [
      handleChange,
      handleCommit,
      handleRetry,
      onFieldChange,
      onFieldCommit,
      onRetry,
    ],
  );
};

export default useResponseStyleSectionHandlers;
