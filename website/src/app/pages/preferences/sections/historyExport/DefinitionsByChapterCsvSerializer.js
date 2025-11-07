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
