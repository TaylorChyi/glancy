import {
  expandCollapsedLabelChains,
  resolveDanglingLabelSeparators,
  restoreMissingLabelDelimiters,
  separateAdjacentInlineLabels,
} from "../chains/index.js";

const LABEL_CHAIN_GOLDENS = [
  {
    label: "restore missing delimiters",
    transform: restoreMissingLabelDelimiters,
    input: `Synonyms swift swift
同义词 精准 严谨
Example She walks Translation 她走路`,
  },
  {
    label: "expand collapsed label chain",
    transform: expandCollapsedLabelChains,
    input: `- 释义:同义词:精准
- Definition:Synonyms:precise`,
  },
  {
    label: "separate adjacent inline labels",
    transform: separateAdjacentInlineLabels,
    input: `Synonyms:fastTranslation:quick
释义:例句:示例`,
  },
  {
    label: "resolve dangling label separators",
    transform: resolveDanglingLabelSeparators,
    input: `- **Example**:Line -
  **Translation**:Segment
- **例句**：继续 -
  **译文**：下一行`,
  },
];

describe("markdown label chain pipelines", () => {
  test.each(LABEL_CHAIN_GOLDENS)(
    "renders %s golden snapshot",
    ({ transform, input }) => {
      expect(transform(input)).toMatchSnapshot();
    },
  );
});
