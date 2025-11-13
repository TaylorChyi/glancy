import { shouldSplitInlineLabel } from "../candidates.js";
import { advancePastDotLeaders } from "./spacing.js";

export const resolveContinuation = ({ spacing, nextIndex, nextToken, line }) => {
  const nextTokenValue = nextToken?.token ?? null;
  const nextIsLabel = nextTokenValue
    ? shouldSplitInlineLabel(nextTokenValue)
    : false;

  if (nextIsLabel) {
    const indent = spacing.length > 1 ? spacing.replace(/\S/g, " ") : "";
    return {
      append: `:\n${indent}`,
      cursor: advancePastDotLeaders(line, nextIndex),
      carryLabelContext: true,
    };
  }

  const preservedSpacing = spacing.length > 0 ? spacing : " ";
  return {
    append: `:${preservedSpacing}`,
    cursor: nextIndex,
    carryLabelContext: false,
  };
};
