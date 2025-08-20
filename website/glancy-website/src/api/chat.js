import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks";

export function createChatApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  /**
   * 流式获取聊天回复并输出统一格式日志。
   * 日志格式:
   *   console.info("[streamChatMessage] <阶段>", { model, messages: <数量>, chunk?, error? })
   */
  async function* streamChatMessage({ model, messages }) {
    const logCtx = { model, messages: messages.length };
    console.info("[streamChatMessage] start", logCtx);
    let response;
    try {
      response = await fetch(API_PATHS.chat, {
        method: "POST",
        body: JSON.stringify({ model, messages }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.info("[streamChatMessage] error", { ...logCtx, error });
      throw error;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line || line === "data: [DONE]") continue;
          const json = JSON.parse(line.replace(/^data: /, ""));
          const content = json?.choices?.[0]?.delta?.content;
          if (content) {
            console.info("[streamChatMessage] chunk", {
              ...logCtx,
              chunk: content,
            });
            yield content;
          }
        }
      }
      console.info("[streamChatMessage] end", logCtx);
    } catch (error) {
      console.info("[streamChatMessage] error", { ...logCtx, error });
      throw error;
    }
  }

  const sendChatMessage = (text) =>
    jsonRequest(API_PATHS.chat, {
      method: "POST",
      body: { text },
    });

  return { sendChatMessage, streamChatMessage };
}

export const { sendChatMessage, streamChatMessage } = createChatApi();

export function useChatApi() {
  return useApi().chat;
}
