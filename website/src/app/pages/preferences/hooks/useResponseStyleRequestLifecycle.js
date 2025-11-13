import { useCallback, useEffect, useMemo } from "react";
import { createResponseStyleRequest } from "./utils/responseStyleRequest.js";

export const useResponseStyleRequestLifecycle = ({
  dispatch,
  user,
  fetchProfile,
  profileDetailsRef,
}) => {
  const requestResponseStyle = useMemo(
    () =>
      createResponseStyleRequest({
        dispatch,
        user,
        fetchProfile,
        profileDetailsRef,
      }),
    [dispatch, fetchProfile, profileDetailsRef, user],
  );

  useEffect(() => {
    const controller = new AbortController();
    requestResponseStyle({ signal: controller.signal });
    return () => controller.abort();
  }, [requestResponseStyle]);

  const handleRetry = useCallback(() => {
    requestResponseStyle({ withLoading: true });
  }, [requestResponseStyle]);

  return { handleRetry };
};

