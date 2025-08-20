import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks";
import { logStream } from "@/utils";

export function createChatApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  /**
   * Stream chat completions with structured logging.
   * Logs: [streamChat] start|chunk|end|error with { model, size, chunk? }.
   */
  async function* streamChatMessage({ model, messages }) {
    logStream("streamChat", "start", { model, size: messages.length });
    let response;
    try {
      response = await fetch(API_PATHS.chat, {
        method: "POST",
        body: JSON.stringify({ model, messages }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      logStream("streamChat", "error", {
        model,
        size: messages.length,
        error: err,
      });
      throw err;
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
            logStream("streamChat", "chunk", {
              model,
              size: messages.length,
              chunk: content,
            });
            yield content;
          }
        }
      }
      logStream("streamChat", "end", { model, size: messages.length });
    } catch (err) {
      logStream("streamChat", "error", {
        model,
        size: messages.length,
        error: err,
      });
      throw err;
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
