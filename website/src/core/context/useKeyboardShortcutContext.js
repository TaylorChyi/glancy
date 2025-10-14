/**
 * 背景：
 *  - 为满足 React Fast Refresh 对组件文件的约束，需要将非组件导出拆分到独立模块。
 * 目的：
 *  - 提供复用的快捷键上下文读取 hook，隐藏底层实现细节。
 * 关键决策与取舍：
 *  - 通过自定义 hook 对外暴露上下文访问，确保调用方不直接接触原始 context 对象；亦评估过直接导出 context，但为降低误用风险最终统一从 hook 切入。
 * 影响范围：
 *  - 所有依赖快捷键信息的组件与工具函数将改用该 hook 获取状态，提升可维护性。
 * 演进与TODO：
 *  - TODO: 后续可在此扩展只读视图或调试辅助信息，例如追加状态选择器以减少重渲染。
 */
import { useContext } from "react";
import KeyboardShortcutContext from "./KeyboardShortcutContext.jsx";

export function useKeyboardShortcutContext() {
  return useContext(KeyboardShortcutContext);
}
