import { useCallback, useMemo } from "react";

const noop = () => {};

const createRetryHandler = (onRetry) =>
  useCallback(() => {
    if (typeof onRetry === "function") {
      onRetry();
    }
  }, [onRetry]);

const createFieldChangeHandler = (onFieldChange) =>
  useCallback(
    (fieldId, value) => {
      if (typeof onFieldChange === "function") {
        onFieldChange(fieldId, value);
      }
    },
    [onFieldChange],
  );

const createFieldCommitHandler = (onFieldCommit) =>
  useCallback(
    (fieldId) => {
      if (typeof onFieldCommit === "function") {
        onFieldCommit(fieldId);
      }
    },
    [onFieldCommit],
  );

const useMemoizedHandlers = ({
  handleRetry,
  handleChange,
  handleCommit,
  onRetry,
  onFieldChange,
  onFieldCommit,
}) =>
  useMemo(
    () => ({
      onRetry: typeof onRetry === "function" ? handleRetry : undefined,
      onFieldChange: typeof onFieldChange === "function" ? handleChange : noop,
      onFieldCommit: typeof onFieldCommit === "function" ? handleCommit : noop,
    }),
    [handleChange, handleCommit, handleRetry, onFieldChange, onFieldCommit, onRetry],
  );

export const useResponseStyleSectionHandlers = ({
  onRetry,
  onFieldChange,
  onFieldCommit,
}) => {
  const handleRetry = createRetryHandler(onRetry);
  const handleChange = createFieldChangeHandler(onFieldChange);
  const handleCommit = createFieldCommitHandler(onFieldCommit);

  return useMemoizedHandlers({
    handleRetry,
    handleChange,
    handleCommit,
    onRetry,
    onFieldChange,
    onFieldCommit,
  });
};

export default useResponseStyleSectionHandlers;
