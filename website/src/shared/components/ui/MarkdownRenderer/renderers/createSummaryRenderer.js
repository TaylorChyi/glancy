/**
 * 背景：
 *  - 折叠摘要需要在 rehype 插件输出的自定义标签与 React 组件之间适配。
 * 目的：
 *  - 根据断行注入策略生成可复用的摘要渲染器，并附带标记供 Section 识别。
 * 关键决策与取舍：
 *  - 保留现有 PropTypes，确保调用方可通过静态属性了解契约；
 *  - 使用 Symbol 标记生成器产物，避免与用户 props 冲突。
 * 影响范围：
 *  - buildMarkdownComponents 生成的组件映射。
 */
import { createElement } from "react";

import CollapsibleSummary from "./CollapsibleSummary.jsx";
import SUMMARY_RENDERER_FLAG from "../constants/summaryRendererFlag.js";

export default function createSummaryRenderer(injectBreaks) {
  const SummaryRenderer = function SummaryRenderer(props) {
    return createElement(CollapsibleSummary, {
      ...props,
      injectBreaks,
    });
  };

  SummaryRenderer.propTypes = CollapsibleSummary.propTypes;
  SummaryRenderer[SUMMARY_RENDERER_FLAG] = true;

  return SummaryRenderer;
}
