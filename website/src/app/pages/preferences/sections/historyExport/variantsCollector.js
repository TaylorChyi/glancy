/**
 * 背景：
 *  - 词典历史项中的“变形”字段记录不同词形，需要格式化输出。
 * 目的：
 *  - 以简洁的文本形式呈现状态与词形组合。
 * 关键决策与取舍：
 *  - 保持 collector 接口，可按需在数组中启用或禁用。
 * 影响范围：
 *  - 偏好设置导出的词形变化章节。
 * 演进与TODO：
 *  - 后续可引入去重或排序策略，避免重复词形。
 */

import { stripMarkdownArtifacts } from "@features/dictionary-experience/markdown/dictionaryPlainTextSanitizer.js";

import { pushChapter } from "./chapterNormalization.js";

const DEFAULT_LABEL = "Variants";

/**
 * 意图：将词形变化转写为导出章节行。
 * 输入：entry、translations、chapters、fallback。
 * 输出：对 chapters 产生副作用。
 */
export const collectStructuredVariants = ({
  entry,
  translations,
  chapters,
  fallback,
}) => {
  const variants = Array.isArray(entry?.["变形"]) ? entry["变形"] : [];
  if (variants.length === 0) {
    return;
  }
  const lines = variants
    .map((variant) => {
      const state = stripMarkdownArtifacts(variant?.状态);
      const form = stripMarkdownArtifacts(variant?.词形);
      if (!form) {
        return "";
      }
      return state ? `${state}：${form}` : form;
    })
    .filter(Boolean);
  if (lines.length > 0) {
    pushChapter(
      chapters,
      translations?.variantsLabel ?? DEFAULT_LABEL,
      lines,
      fallback,
    );
  }
};
