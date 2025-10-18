/**
 * 背景：
 *  - 历史导出存在多处组合入口，需要统一对外暴露契约。
 * 目的：
 *  - 聚合导出策略与测试所需的内部工具，避免调用方散乱引用。
 * 关键决策与取舍：
 *  - 暴露 __INTERNAL__ 仅用于测试场景，保持业务入口精简；
 *  - 文件夹内各模块按照职责拆分，便于后续新增策略时拓展。
 * 影响范围：
 *  - 偏好设置 DataSection 及相关测试代码。
 * 演进与TODO：
 *  - 若新增更多导出格式，可在此统一注册导出器实例。
 */

import * as csvPrimitives from "./csvPrimitives.js";
import * as markdownChapterParser from "./markdownChapterParser.js";
import { deriveChaptersFromEntry } from "./deriveChaptersFromEntry.js";

export { definitionsByChapterCsvSerializer } from "./DefinitionsByChapterCsvSerializer.js";
export { DefinitionsByChapterCsvSerializer } from "./DefinitionsByChapterCsvSerializer.js";

export const __INTERNAL__ = Object.freeze({
  ...csvPrimitives,
  ...markdownChapterParser,
  deriveChaptersFromEntry,
});
