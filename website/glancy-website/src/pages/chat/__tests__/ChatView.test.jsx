/**
 * 测试流程：
 * 1. 构造一个异步生成器，先后产出 'Hel' 与 'lo'，中间插入短暂延迟。
 * 2. 渲染 ChatView 并发送消息，组件应先显示 'Hel'，且此时 DOM 中不应出现 'Hello'。
 * 3. 第二块到达后，DOM 更新为 'Hello'，从而验证流式渲染。
 */
import { render, screen, fireEvent } from "@testing-library/react";
import ChatView from "../ChatView.jsx";

test("stream message renders progressively", async () => {
  async function* mockStream() {
    yield "Hel";
    await new Promise((r) => setTimeout(r, 10));
    yield "lo";
  }
  render(<ChatView streamFn={mockStream} />);
  const input = screen.getByPlaceholderText("输入消息");
  fireEvent.change(input, { target: { value: "hi" } });
  fireEvent.submit(input.form);

  await screen.findByText("Hel", { exact: true });
  expect(screen.queryByText("Hello", { exact: true })).toBeNull();
  await screen.findByText("Hello", { exact: true });
});
