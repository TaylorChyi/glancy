import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { copyTextToClipboard } from "@shared/utils";

const COPY_FEEDBACK_RESET_DELAY_MS = 2000;

export const COPY_FEEDBACK_STATES = Object.freeze({
  IDLE: "idle",
  SUCCESS: "success",
});

export const COPY_STATUS = Object.freeze({
  COPIED: "copied",
  EMPTY: "empty",
  FAILED: "failed",
  DEFAULT: "default",
});

export const useCopyFeedbackMessages = (t) =>
  useMemo(() => {
    const base = t.copyAction || "Copy";
    const failure = t.copyFailed || base;
    return Object.freeze({
      base,
      fallback: failure,
      statuses: Object.freeze({
        copied: null,
        empty: t.copyEmpty || failure,
        unavailable: t.copyUnavailable || failure,
        failed: failure,
        default: failure,
      }),
    });
  }, [t.copyAction, t.copyFailed, t.copyEmpty, t.copyUnavailable]);

export const useCopyPopup = (messages, showPopup) => {
  const resolveCopyPopupMessage = useCallback(
    (status) => {
      const { base, fallback, statuses } = messages;
      const resolvedFallback = statuses.default ?? fallback ?? base ?? "Copy";
      if (!status) {
        return resolvedFallback;
      }
      if (Object.prototype.hasOwnProperty.call(statuses, status)) {
        return statuses[status];
      }
      return resolvedFallback;
    },
    [messages],
  );

  return useCallback(
    (status) => {
      const message = resolveCopyPopupMessage(status);
      if (message) {
        showPopup(message);
      }
    },
    [resolveCopyPopupMessage, showPopup],
  );
};

export const useCopyFeedbackTimer = () => {
  const timerRef = useRef(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (callback) => {
      clear();
      timerRef.current = setTimeout(() => {
        callback();
        timerRef.current = null;
      }, COPY_FEEDBACK_RESET_DELAY_MS);
    },
    [clear],
  );

  useEffect(() => () => clear(), [clear]);

  return { clear, schedule };
};

export const useCopyAttemptResolver = ({ canCopyDefinition, copyPayload }) =>
  useCallback(async () => {
    if (!canCopyDefinition) {
      return COPY_STATUS.EMPTY;
    }

    try {
      const result = await copyTextToClipboard(copyPayload);
      if (result?.status === COPY_STATUS.COPIED) {
        return COPY_STATUS.COPIED;
      }
      return result?.status || COPY_STATUS.DEFAULT;
    } catch {
      return COPY_STATUS.FAILED;
    }
  }, [canCopyDefinition, copyPayload]);

export const useCopyStateMachine = ({ pushCopyPopup, onSuccess, onReset }) =>
  useMemo(() => {
    const transitions = {
      [COPY_STATUS.COPIED]: () => {
        onSuccess();
        pushCopyPopup(COPY_STATUS.COPIED);
      },
      [COPY_STATUS.EMPTY]: () => {
        onReset();
        pushCopyPopup(COPY_STATUS.EMPTY);
      },
      [COPY_STATUS.FAILED]: () => {
        onReset();
        pushCopyPopup(COPY_STATUS.FAILED);
      },
    };

    return (event = COPY_STATUS.DEFAULT) => {
      const normalizedEvent = event || COPY_STATUS.DEFAULT;
      const transition = transitions[normalizedEvent];
      if (transition) {
        transition();
        return;
      }

      onReset();
      pushCopyPopup(normalizedEvent);
    };
  }, [onReset, onSuccess, pushCopyPopup]);

export const useCopyHandler = ({ resolveCopyEvent, dispatchCopyStatus }) =>
  useCallback(async () => {
    const event = await resolveCopyEvent();
    dispatchCopyStatus(event);
  }, [dispatchCopyStatus, resolveCopyEvent]);

export const useCopyFeedbackController = ({ pushCopyPopup }) => {
  const [copyFeedbackState, setCopyFeedbackState] = useState(
    COPY_FEEDBACK_STATES.IDLE,
  );
  const { clear, schedule } = useCopyFeedbackTimer();

  const resetCopyFeedback = useCallback(() => {
    clear();
    setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
  }, [clear]);

  const scheduleCopyFeedbackReset = useCallback(() => {
    schedule(() => setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE));
  }, [schedule]);

  const markCopySuccess = useCallback(() => {
    setCopyFeedbackState(COPY_FEEDBACK_STATES.SUCCESS);
    scheduleCopyFeedbackReset();
  }, [scheduleCopyFeedbackReset]);

  const dispatchCopyStatus = useCopyStateMachine({
    onSuccess: markCopySuccess,
    onReset: resetCopyFeedback,
    pushCopyPopup,
  });

  const isCopySuccessActive =
    copyFeedbackState === COPY_FEEDBACK_STATES.SUCCESS;

  return {
    copyFeedbackState,
    dispatchCopyStatus,
    isCopySuccessActive,
    resetCopyFeedback,
  };
};
