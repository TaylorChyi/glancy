import { render, screen } from "@testing-library/react";
import React from "react";
import { jest } from "@jest/globals";

import ChatTranscript from "../ChatTranscript.jsx";
import {
  MARKDOWN_RENDERING_MODE_DYNAMIC,
  useSettingsStore,
} from "@core/store/settings";

beforeEach(() => {
  useSettingsStore.setState({
    markdownRenderingMode: MARKDOWN_RENDERING_MODE_DYNAMIC,
  });
});

/**
 * 验证默认渲染路径能够输出 Markdown 元素并继承角色语义。
 */
test("renders markdown messages with role semantics", () => {
  const messages = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "**Bold**" },
  ];

  render(<ChatTranscript messages={messages} />);

  const normalize = (value) => value.replace(/\u200b/gi, "");
  const userArticle = screen
    .getByText((text) => normalize(text) === "Hello")
    .closest("article");
  expect(userArticle).toHaveAttribute("data-role", "user");
  const strong = screen.getByText((text) => normalize(text) === "Bold");
  expect(strong.tagName).toBe("STRONG");
});

/**
 * 验证 renderMessage 回调可以覆写单条消息的结构。
 */
test("allows overriding message rendering through template hook", () => {
  const messages = [{ role: "assistant", content: "custom" }];
  const renderMessage = jest.fn().mockImplementation((message, context) => {
    expect(context.Renderer).toBeInstanceOf(Function);
    return <span data-testid="custom">{message.content}</span>;
  });

  render(<ChatTranscript messages={messages} renderMessage={renderMessage} />);

  expect(renderMessage).toHaveBeenCalledWith(
    messages[0],
    expect.objectContaining({ Renderer: expect.any(Function), index: 0 }),
  );
  expect(screen.getByTestId("custom").tagName).toBe("SPAN");
});
