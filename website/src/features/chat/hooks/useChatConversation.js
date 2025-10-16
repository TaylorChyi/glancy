/**
 * 背景：
 *  - ChatView 既负责状态管理又处理流式拼接，难以在其他界面复用或扩展新的响应模式。
 * 目的：
 *  - 提供统一的会话状态 Hook，对外仅暴露行为接口与消息数组，将实现细节下沉。
 * 关键决策与取舍：
 *  - 采用策略模式分别封装流式与同步响应流程，便于未来插拔新的模式；
 *  - 使用可变引用维护历史，避免页面层重复实现副作用控制。
 * 影响范围：
 *  - ChatView 以及所有后续需要请求助手回复的界面；
 *  - 依赖 DEFAULT_MODEL 的调用约定保持不变，兼容现有后端接口。
 * 演进与TODO：
 *  - 后续可通过参数注入 metrics 记录或特性开关，扩展错误兜底策略。
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { DEFAULT_MODEL } from "@core/config";
import {
  CHAT_COMPLETION_MODE_STREAMING,
  CHAT_COMPLETION_MODE_SYNC,
  useSettingsStore,
} from "@core/store/settings";
import { createAssistantMessageFormatter } from "../createAssistantMessageFormatter.js";

const CONVERSATION_STATUS = Object.freeze({
  idle: "idle",
  processing: "processing",
  error: "error",
});

const RESPONSE_STRATEGIES = Object.freeze({
  [CHAT_COMPLETION_MODE_STREAMING]: handleStreamingResponse,
  [CHAT_COMPLETION_MODE_SYNC]: handleSyncResponse,
});

function ensureResponseStrategy(mode) {
  return (
    RESPONSE_STRATEGIES[mode] ??
    RESPONSE_STRATEGIES[CHAT_COMPLETION_MODE_STREAMING]
  );
}

function handleStreamingResponse({
  streamFn,
  history,
  formatter,
  appendAssistantMessage,
  updateAssistantMessage,
}) {
  if (typeof streamFn !== "function") {
    throw new TypeError(
      "streamFn must be a function when using streaming mode",
    );
  }

  return (async () => {
    let firstChunk = true;
    for await (const chunk of streamFn({
      model: DEFAULT_MODEL,
      messages: history,
      responseMode: "stream",
    })) {
      const formatted = formatter.append(chunk ?? "");
      if (firstChunk) {
        appendAssistantMessage(formatted);
        firstChunk = false;
      } else {
        updateAssistantMessage(formatted);
      }
    }
  })();
}

function handleSyncResponse({
  completeFn,
  history,
  formatter,
  appendAssistantMessage,
}) {
  if (typeof completeFn !== "function") {
    throw new TypeError("completeFn must be a function when using sync mode");
  }

  return completeFn({
    model: DEFAULT_MODEL,
    messages: history,
    responseMode: "sync",
  }).then((result) => {
    const formatted = formatter.append(result ?? "");
    appendAssistantMessage(formatted);
  });
}

export function useChatConversation({ streamFn, completeFn }) {
  const formatterRef = useRef(null);
  const messagesRef = useRef([]);
  const [messages, setMessages] = useState(() => {
    const initial = [];
    messagesRef.current = initial;
    return initial;
  });
  const [status, setStatus] = useState(CONVERSATION_STATUS.idle);
  const chatCompletionMode = useSettingsStore(
    (state) => state.chatCompletionMode,
  );
  const responseStrategy = useMemo(
    () => ensureResponseStrategy(chatCompletionMode),
    [chatCompletionMode],
  );

  const updateMessages = useCallback((updater) => {
    setMessages((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      messagesRef.current = next;
      return next;
    });
  }, []);

  const ensureFormatter = useCallback(() => {
    if (!formatterRef.current) {
      formatterRef.current = createAssistantMessageFormatter();
    }
    return formatterRef.current;
  }, []);

  const appendAssistantMessage = useCallback(
    (content) => {
      updateMessages((prev) => [...prev, { role: "assistant", content }]);
    },
    [updateMessages],
  );

  const updateAssistantMessage = useCallback(
    (content) => {
      updateMessages((prev) => {
        if (prev.length === 0) {
          return [{ role: "assistant", content }];
        }
        const next = prev.slice();
        const lastIndex = next.length - 1;
        const last = next[lastIndex];
        if (last?.role === "assistant") {
          next[lastIndex] = { ...last, content };
          return next;
        }
        return [...next, { role: "assistant", content }];
      });
    },
    [updateMessages],
  );

  const resetConversation = useCallback(() => {
    const formatter = ensureFormatter();
    formatter.reset();
    updateMessages([]);
    setStatus(CONVERSATION_STATUS.idle);
  }, [ensureFormatter, updateMessages]);

  const sendUserMessage = useCallback(
    async (content) => {
      const formatter = ensureFormatter();
      formatter.reset();
      const userMessage = { role: "user", content };
      const history = [...messagesRef.current, userMessage];
      updateMessages(history);
      setStatus(CONVERSATION_STATUS.processing);

      try {
        await responseStrategy({
          streamFn,
          completeFn,
          history,
          formatter,
          appendAssistantMessage,
          updateAssistantMessage,
        });
        setStatus(CONVERSATION_STATUS.idle);
      } catch (error) {
        console.error("[chat] failed to resolve assistant response", error);
        setStatus(CONVERSATION_STATUS.error);
      }
    },
    [
      appendAssistantMessage,
      completeFn,
      ensureFormatter,
      responseStrategy,
      streamFn,
      updateAssistantMessage,
      updateMessages,
    ],
  );

  return {
    messages,
    status,
    sendUserMessage,
    resetConversation,
  };
}

export { CONVERSATION_STATUS as CHAT_CONVERSATION_STATUS };
