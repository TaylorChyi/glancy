import { API_PATHS } from "@/config/api.js";
import { apiRequest, createJsonRequest } from "./client.js";
import { useApi } from "@/hooks";

export function createChatApi(request = apiRequest) {
  const jsonRequest = createJsonRequest(request);

  async function* streamChatMessage({ model, messages }) {
    const response = await fetch(API_PATHS.chat, {
      method: "POST",
      body: JSON.stringify({ model, messages }),
      headers: { "Content-Type": "application/json" },
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
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
        if (content) yield content;
      }
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
