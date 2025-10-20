/**
 * 背景：
 *  - OutputToolbar 既要展示多版本的索引，又需支持可扩展的版本选择体验。
 * 目的：
 *  - 将版本相关的衍生数据计算集中于纯函数 Hook，保持主组件精简且易于测试。
 * 关键决策与取舍：
 *  - 采用 ViewModel（MVVM 模式的查询端口）封装派生状态，避免在展示组件中散落 useMemo；
 *  - 当缺失时间信息时退化为展示 term 文本，保证选项仍具辨识度。
 * 影响范围：
 *  - OutputToolbar 及后续可能复用版本拨盘的组件。
 * 演进与TODO：
 *  - 如需支持更多时间格式，可注入 formatter 策略以取代内置逻辑。
 */
import { useMemo, useCallback } from "react";

const DEFAULT_INDICATOR_TEMPLATE = "{current} / {total}";
const DEFAULT_INDICATOR_EMPTY = "0 / 0";
const DEFAULT_OPTION_TEMPLATE = "Version {index}";
const DEFAULT_PAGER_LABEL = "例句翻页";
const DEFAULT_MENU_LABEL = "Select version";

const computePosition = (versions, activeVersionId) => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return { currentIndex: 0, total: 0 };
  }
  const resolvedIndex = versions.findIndex((item) => {
    const candidateId = item?.id ?? item?.versionId;
    if (candidateId == null) return false;
    return String(candidateId) === String(activeVersionId);
  });
  const index = resolvedIndex >= 0 ? resolvedIndex + 1 : versions.length;
  return { currentIndex: index, total: versions.length };
};

const createFormatter = (lang) => {
  const locale = lang === "en" ? "en-US" : "zh-CN";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
};

const buildDescription = (candidate, normalizedTerm, formatter) => {
  const timestamp = candidate?.createdAt ?? candidate?.metadata?.createdAt;
  if (timestamp && formatter) {
    try {
      return formatter.format(new Date(timestamp));
    } catch {
      /* noop: fallback below */
    }
  }
  const versionTerm =
    typeof candidate?.term === "string" ? candidate.term.trim() : "";
  if (versionTerm && versionTerm !== normalizedTerm) {
    return versionTerm;
  }
  return undefined;
};

const resolveOptionValue = (candidate, index) =>
  candidate?.id ?? candidate?.versionId ?? String(index);

const buildOption = ({
  candidate,
  index,
  template,
  normalizedTerm,
  formatter,
}) => ({
  value: String(resolveOptionValue(candidate, index) ?? index),
  label: template.replace("{index}", String(index + 1)),
  description: buildDescription(candidate, normalizedTerm, formatter),
});

const mapVersionsToOptions = ({
  versions,
  translator,
  normalizedTerm,
  lang,
}) => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return [];
  }
  const formatter = createFormatter(lang);
  const template = translator.versionOptionLabel || DEFAULT_OPTION_TEMPLATE;
  const options = [];
  for (let index = 0; index < versions.length; index += 1) {
    options.push(
      buildOption({
        candidate: versions[index],
        index,
        template,
        normalizedTerm,
        formatter,
      }),
    );
  }
  return options;
};

const resolveIndicator = ({ currentIndex, total }, translator) => {
  if (!total) {
    return translator.versionIndicatorEmpty || DEFAULT_INDICATOR_EMPTY;
  }
  const template = translator.versionIndicator || DEFAULT_INDICATOR_TEMPLATE;
  return template
    .replace("{current}", String(currentIndex))
    .replace("{total}", String(total));
};

const canSelectFromOptions = ({ versionOptions, disabled, onSelectVersion }) =>
  Array.isArray(versionOptions) &&
  versionOptions.length > 1 &&
  typeof onSelectVersion === "function" &&
  !disabled;

/**
 * 意图：
 *  - 依据词条版本数据输出拨盘/下拉所需的派生信息。
 * 输入：
 *  - versions: 词条版本列表，可为空；
 *  - activeVersionId: 当前选中版本；
 *  - lang: 语言代码，用于选择日期本地化方案；
 *  - term: 词条原文，缺省时用于补充描述；
 *  - disabled: 工具栏禁用态；
 *  - onSelectVersion: 选择版本时的回调；
 *  - translator: 本地化文案字典。
 * 输出：
 *  - 包含导航能力、指标文本、选项数组等渲染所需数据。
 * 流程：
 *  1) 计算当前索引与总数；
 *  2) 基于语言推导日期格式化器并生成下拉选项；
 *  3) 组合导航按钮状态及选择回调。
 * 错误处理：
 *  - 捕获 Intl.DateTimeFormat 构造异常并回落到无格式化路径。
 * 复杂度：
 *  - O(n) 枚举版本数组，额外空间 O(n)。
 */
export function useVersionViewModel({
  versions,
  activeVersionId,
  lang,
  term,
  disabled,
  onSelectVersion,
  translator,
}) {
  const normalizedTerm = typeof term === "string" ? term.trim() : "";

  const position = useMemo(
    () => computePosition(versions, activeVersionId),
    [versions, activeVersionId],
  );

  const versionOptions = useMemo(
    () =>
      mapVersionsToOptions({
        versions,
        translator,
        normalizedTerm,
        lang,
      }),
    [versions, translator, normalizedTerm, lang],
  );

  const canSelectVersion = canSelectFromOptions({
    versionOptions,
    disabled,
    onSelectVersion,
  });

  const versionSelectValue =
    activeVersionId != null ? String(activeVersionId) : "";

  const handleVersionSelect = useCallback(
    (value) => {
      if (!canSelectVersion || value == null) return;
      onSelectVersion?.(String(value));
    },
    [canSelectVersion, onSelectVersion],
  );

  return {
    hasPrevious: position.total > 1 && position.currentIndex > 1,
    hasNext: position.total > 1 && position.currentIndex < position.total,
    indicator: resolveIndicator(position, translator),
    pagerLabel: translator.versionGroupLabel || DEFAULT_PAGER_LABEL,
    versionOptions,
    versionSelectValue,
    versionMenuLabel: translator.versionMenuLabel || DEFAULT_MENU_LABEL,
    canSelectVersion,
    handleVersionSelect,
  };
}
