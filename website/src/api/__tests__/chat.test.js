import { createChatApi } from "@/api/chat.js";
import { API_PATHS } from "@/config/api.js";
import { jest } from "@jest/globals";

test("sendChatMessage posts to chat endpoint", async () => {
  const request = jest.fn().mockResolvedValue("ok");
  const api = createChatApi(request);
  await api.sendChatMessage("hi");
  expect(request).toHaveBeenCalledWith(
    API_PATHS.chat,
    expect.objectContaining({
      method: "POST",
    }),
  );
});

test("completeChatMessage requests aggregated response", async () => {
  const request = jest.fn().mockResolvedValue({ content: "done" });
  const api = createChatApi(request);
  const result = await api.completeChatMessage({
    model: "stub",
    messages: [{ role: "user", content: "hi" }],
    temperature: 0.7,
  });
  expect(request).toHaveBeenCalledWith(
    API_PATHS.chat,
    expect.objectContaining({
      headers: expect.objectContaining({ Accept: "application/json" }),
    }),
  );
  expect(result).toBe("done");
});
