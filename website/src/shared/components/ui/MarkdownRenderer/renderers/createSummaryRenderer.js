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
