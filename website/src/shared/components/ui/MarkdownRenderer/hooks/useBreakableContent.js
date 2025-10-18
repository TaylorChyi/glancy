/**
 * 背景：
 *  - 断行注入逻辑过去直接存在于组件文件中，难以在不同渲染器之间共享。
 * 目的：
 *  - 以自定义 Hook 封装断行注入器的创建与缓存，使调用方免于关心实现细节。
 * 关键决策与取舍：
 *  - 使用 useMemo 确保注入器实例稳定，避免在 ReactMarkdown 树内重复计算；
 *  - 将具体实现委托给 createBreakInjector，以便单独测试和演进。
 * 影响范围：
 *  - 动态 Markdown 渲染分支。
 */
import { useMemo } from "react";

import createBreakInjector from "../utils/createBreakInjector.js";

export default function useBreakableContent() {
  return useMemo(() => createBreakInjector(), []);
}
