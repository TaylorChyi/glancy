/**
 * 背景：
 *  - 偏好设置页面的数据导出需要按章节拆分释义，便于用户在表格中筛选。
 * 目的：
 *  - 复用模板方法骨架，实现“章节 + 内容”维度的 CSV 导出策略。
 * 关键决策与取舍：
 *  - 通过依赖注入 resolveEntry，保持页面与数据层解耦；
 *  - 若条目无章节信息，则回退至默认章节，确保导出结构完整。
 * 影响范围：
 *  - 偏好设置 DataSection 的导出行为。
 * 演进与TODO：
 *  - 后续可新增多格式导出，通过组合不同 serializer 实现扩展。
 */

import { HistoryCsvSerializerTemplate } from "./HistoryCsvSerializerTemplate.js";
import { joinChapterContent } from "./markdownChapterParser.js";
import { deriveChaptersFromEntry } from "./deriveChaptersFromEntry.js";

const toBaseRow = (item) => [
  item?.term ?? "",
  item?.language ?? "",
  item?.flavor ?? "",
];

const createFallbackRow = (item, translations) => [
  ...toBaseRow(item),
  translations?.settingsDataExportDefaultChapter ?? "General",
  "",
];

const createChapterRow = (item, chapter) => [
  ...toBaseRow(item),
  chapter.heading,
  joinChapterContent(chapter.lines),
];

const resolveEntryFromContext = (resolveEntry, item) =>
  typeof resolveEntry === "function" ? resolveEntry(item) : undefined;

export class DefinitionsByChapterCsvSerializer extends HistoryCsvSerializerTemplate {
  buildHeader(context) {
    const chapterColumn =
      context?.translations?.settingsDataExportChapterColumn ?? "chapter";
    const contentColumn =
      context?.translations?.settingsDataExportContentColumn ?? "content";
    return ["term", "language", "flavor", chapterColumn, contentColumn];
  }

  buildRows(historyItems, context) {
    const { resolveEntry, translations } = context ?? {};
    return historyItems.reduce((accumulator, item) => {
      if (!item) {
        return accumulator;
      }
      const entry = resolveEntryFromContext(resolveEntry, item);
      const chapters = deriveChaptersFromEntry({ entry, translations });
      if (chapters.length === 0) {
        accumulator.push(createFallbackRow(item, translations));
        return accumulator;
      }
      chapters
        .map((chapter) => createChapterRow(item, chapter))
        .forEach((row) => accumulator.push(row));
      return accumulator;
    }, []);
  }
}

export const definitionsByChapterCsvSerializer =
  new DefinitionsByChapterCsvSerializer();
