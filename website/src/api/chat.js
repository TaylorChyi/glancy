import { API_PATHS, DEFAULT_MODEL } from "@/config";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks/useApi.js";
import { parseSse } from "@/utils";

export function createChatApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  /**
   * 流式获取聊天回复并输出统一格式日志。
   * 日志格式:
   *   console.info("[streamChatMessage] <阶段>", { model, messages: <数量>, chunk?, error? })
   *
   * @param {{model: string, messages: Array}} options
   * @returns {AsyncGenerator<string>}
   */
  async function* streamChatMessage({
    model = DEFAULT_MODEL,
    messages,
    responseMode = "stream",
  }) {
    const logCtx = { model, messages: messages.length };
    console.info("[streamChatMessage] start", logCtx);
    let response;
    try {
      response = await fetch(API_PATHS.chat, {
        method: "POST",
        body: JSON.stringify({ model, messages, responseMode }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.info("[streamChatMessage] error", { ...logCtx, error });
      throw error;
    }
    try {
      for await (const { data } of parseSse(response.body)) {
        if (data === "[DONE]") continue;
        if (!data) continue;
        const json = JSON.parse(data);
        const content = json?.choices?.[0]?.delta?.content;
        if (content) {
          console.info("[streamChatMessage] chunk", {
            ...logCtx,
            chunk: content,
          });
          yield content;
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

  async function completeChatMessage({
    model = DEFAULT_MODEL,
    messages,
    temperature,
    responseMode = "sync",
  }) {
    const logCtx = { model, messages: messages.length };
    console.info("[completeChatMessage] start", logCtx);
    try {
      const response = await jsonRequest(API_PATHS.chat, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: { model, messages, temperature, responseMode },
      });
      const content = response?.content ?? "";
      console.info("[completeChatMessage] end", {
        ...logCtx,
        length: content.length,
      });
      return content;
    } catch (error) {
      console.info("[completeChatMessage] error", { ...logCtx, error });
      throw error;
    }
  }

  return { sendChatMessage, streamChatMessage, completeChatMessage };
}

export const { sendChatMessage, streamChatMessage, completeChatMessage } =
  createChatApi();

export function useChatApi() {
  return useApi().chat;
}
