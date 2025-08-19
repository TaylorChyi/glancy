/**
 * 测试流程：
 * 1. 构造一个异步生成器，先后产出 'Hel' 与 'lo'。
 * 2. 渲染 ChatView 并发送消息，组件应先显示 'Hel'，随后更新为 'Hello'。
 * 3. 通过 testing-library 观察 DOM 变化以验证流式渲染。
 */
import { render, screen, fireEvent } from "@testing-library/react";
import ChatView from "../ChatView.jsx";

test("stream message renders progressively", async () => {
  async function* mockStream() {
    yield "Hel";
    await Promise.resolve();
    yield "lo";
  }
  render(<ChatView streamFn={mockStream} />);
  const input = screen.getByPlaceholderText("输入消息");
  fireEvent.change(input, { target: { value: "hi" } });
  fireEvent.submit(input.form);

  await screen.findByText("Hel", { exact: true });
  await screen.findByText("Hello", { exact: true });
});
