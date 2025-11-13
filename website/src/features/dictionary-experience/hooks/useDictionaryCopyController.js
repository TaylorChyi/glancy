import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractMarkdownPreview, copyTextToClipboard } from "@shared/utils";
import { normalizeDictionaryMarkdown } from "@features/dictionary-experience/markdown/dictionaryMarkdownNormalizer.js";

export const COPY_FEEDBACK_STATES = Object.freeze({
  IDLE: "idle",
  SUCCESS: "success",
});

const COPY_FEEDBACK_RESET_DELAY_MS = 2000;
const COPY_STATUS = Object.freeze({
  COPIED: "copied",
  EMPTY: "empty",
  FAILED: "failed",
  DEFAULT: "default",
});

const useCopyPayload = ({ entry, finalText, currentTerm }) =>
  useMemo(() => {
    const stringCandidates = [
      typeof entry?.markdown === "string" ? entry.markdown : null,
      typeof finalText === "string" ? finalText : null,
    ];

    for (const candidate of stringCandidates) {
      if (!candidate || !candidate.trim()) {
        continue;
      }
      const preview = extractMarkdownPreview(candidate);
      const normalized = preview == null ? candidate : preview;
      return normalizeDictionaryMarkdown(normalized);
    }

    if (entry && typeof entry === "object") {
      try {
        return JSON.stringify(entry, null, 2);
      } catch {
        return currentTerm || "";
      }
    }

    return currentTerm || "";
  }, [entry, finalText, currentTerm]);

const useCopyFeedbackMessages = (t) =>
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

const useCopyPopup = (messages, showPopup) => {
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

const useCopyFeedbackTimer = () => {
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

const useCopyAttemptResolver = ({ canCopyDefinition, copyPayload }) =>
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

const useCopyStateMachine = ({ pushCopyPopup, onSuccess, onReset }) =>
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

/**
 * 意图：集中管理复制行为的所有状态与副作用，为上层提供可组合的控制器。
 * 输入：
 *  - entry/finalText/currentTerm：复制内容的候选来源；
 *  - t：国际化字典，需包含复制相关文案；
 *  - showPopup：弹窗提示函数。
 * 输出：复制能力是否可用、当前状态、复制动作、复位方法等。
 * 流程：
 *  1) 按优先级计算可复制文本并标准化；
 *  2) 依据复制结果更新状态并触发提示；
 *  3) 通过定时器在成功态两秒后恢复空闲态。
 * 错误处理：捕获剪贴板写入异常并回退至 idle。
 * 复杂度：O(n) 取决于候选数组长度，当前为常量 3。
 */
export function useDictionaryCopyController({
  entry,
  finalText,
  currentTerm,
  t,
  showPopup,
}) {
  const [copyFeedbackState, setCopyFeedbackState] = useState(
    COPY_FEEDBACK_STATES.IDLE,
  );
  const copyPayload = useCopyPayload({ entry, finalText, currentTerm });
  const canCopyDefinition = useMemo(
    () => typeof copyPayload === "string" && copyPayload.trim().length > 0,
    [copyPayload],
  );
  const copyFeedbackMessages = useCopyFeedbackMessages(t);
  const pushCopyPopup = useCopyPopup(copyFeedbackMessages, showPopup);
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

  const resolveCopyEvent = useCopyAttemptResolver({
    canCopyDefinition,
    copyPayload,
  });

  const dispatchCopyStatus = useCopyStateMachine({
    onSuccess: markCopySuccess,
    onReset: resetCopyFeedback,
    pushCopyPopup,
  });

  const handleCopy = useCallback(async () => {
    const event = await resolveCopyEvent();
    dispatchCopyStatus(event);
  }, [
    dispatchCopyStatus,
    resolveCopyEvent,
  ]);

  const isCopySuccessActive =
    copyFeedbackState === COPY_FEEDBACK_STATES.SUCCESS;

  return {
    canCopyDefinition,
    copyFeedbackState,
    handleCopy,
    isCopySuccessActive,
    resetCopyFeedback,
  };
}
