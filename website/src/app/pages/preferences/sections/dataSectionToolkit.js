/**
 * 背景：
 *  - DataSection 组件长期承担数据治理相关的格式转换与语言选项推导，逻辑臃肿导致
 *    结构化 Lint 阈值无法恢复。为了让 UI 组件聚焦展示，本工具模块抽离了纯计算能力。
 * 目的：
 *  - 暴露词典历史导出与语言选项计算的纯函数，支撑未来按需复用与单测覆盖。
 * 关键决策与取舍：
 *  - 以函数式接口输出，避免引入可变状态；
 *  - 复用 historyExportSerializer 模板方法，确保导出格式与既有实现兼容；
 *  - 语言映射保留大小写归一策略，为多语言扩展留出一致的扩展点。
 * 影响范围：
 *  - 偏好设置数据分区的导出与语言筛选逻辑；
 *  - 未来如需扩展更多序列化格式，可在此模块新增策略函数。
 * 演进与TODO：
 *  - TODO: 接入服务端导出接口后，考虑在此模块提供流式下载适配器。
 */

import { definitionsByChapterCsvSerializer } from "./historyExportSerializer.js";

const LANGUAGE_ENGLISH_TOKEN = "ENGLISH";
const LANGUAGE_CHINESE_TOKEN = "CHINESE";

const FALLBACK_LANGUAGE_LABELS = {
  [LANGUAGE_ENGLISH_TOKEN]: "English",
  [LANGUAGE_CHINESE_TOKEN]: "Chinese",
};

/**
 * 意图：提供统一的语言值归一化能力，避免各处重复判断 null/undefined。
 * 输入：任意可能为空的值。
 * 输出：归一化后的大写字符串，或空字符串。
 * 流程：
 *  1) 判断值是否为空。
 *  2) 统一转为字符串并取大写。
 * 错误处理：空值直接返回空字符串。
 * 复杂度：O(1)。
 */
export const normalizeLanguageValue = (value) =>
  value == null ? "" : String(value).toUpperCase();

/**
 * 意图：根据语言代码映射用户可读文案，优先使用翻译文件中的描述。
 * 输入：
 *  - translations: 语言包对象；
 *  - language: 原始语言标识。
 * 输出：用户可读的语言标签。
 * 流程：
 *  1) 归一化语言标识；
 *  2) 根据中英文令牌返回翻译文案或兜底文案；
 *  3) 其他语言直接返回归一化标识。
 * 错误处理：缺失翻译时使用 FALLBACK_LANGUAGE_LABELS 兜底。
 * 复杂度：O(1)。
 */
const mapHistoryLanguageLabel = (translations, language) => {
  const normalized = normalizeLanguageValue(language);
  if (normalized === LANGUAGE_ENGLISH_TOKEN) {
    return (
      translations.dictionaryTargetLanguageEnglish ??
      translations.dictionarySourceLanguageEnglish ??
      FALLBACK_LANGUAGE_LABELS[LANGUAGE_ENGLISH_TOKEN]
    );
  }
  if (normalized === LANGUAGE_CHINESE_TOKEN) {
    return (
      translations.dictionaryTargetLanguageChinese ??
      translations.dictionarySourceLanguageChinese ??
      FALLBACK_LANGUAGE_LABELS[LANGUAGE_CHINESE_TOKEN]
    );
  }
  return normalized;
};

/**
 * 意图：按照章节粒度序列化历史记录，供浏览器下载。
 * 输入：
 *  - history: 历史记录集合；
 *  - translations: 语言包，用于生成列头与章节占位；
 *  - resolveEntry: 根据 termKey 获取完整词条的方法。
 * 输出：符合 RFC4180 的 CSV 字符串。
 * 流程：
 *  1) 交由 historyExportSerializer 生成表头与数据；
 *  2) 返回序列化后的文本内容。
 * 错误处理：序列化器内部处理异常兜底章节。
 * 复杂度：时间 O(n·m)，空间 O(n·m)。
 */
export const serializeHistoryToCsv = ({
  history,
  translations,
  resolveEntry,
}) =>
  definitionsByChapterCsvSerializer.serialize(history, {
    translations,
    resolveEntry,
  });

/**
 * 意图：根据历史记录推导可供用户选择的语言选项。
 * 输入：
 *  - history: 历史记录集合；
 *  - translations: 语言包，用于语言标签翻译。
 * 输出：带 label/value 的选项数组，按 label 排序。
 * 流程：
 *  1) 抽取历史记录中的语言并去重；
 *  2) 归一化 value 并映射 label；
 *  3) 依据 label 进行排序。
 * 错误处理：过滤空白或非字符串的语言。
 * 复杂度：O(n log n)，n 为语言种类数量。
 */
export const toLanguageOptions = (history, translations) => {
  const unique = new Set(
    history
      .map((item) => item.language)
      .filter((value) => typeof value === "string" && value.trim().length > 0),
  );

  return Array.from(unique)
    .map((language) => ({
      value: normalizeLanguageValue(language),
      label: mapHistoryLanguageLabel(translations, language),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
