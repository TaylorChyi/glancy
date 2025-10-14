/**
 * 背景：
 *  - 抖宝模型在词典模式下输出的 Markdown 为紧凑字段串，缺乏换行与空格，导致前端渲染层无法识别结构。
 * 目的：
 *  - 引入可扩展的格式化器工厂，对助手流式输出按策略进行预处理，恢复 Markdown 层级与可读性。
 * 关键决策与取舍：
 *  - 采用“策略模式”封装不同模型/内容类型的格式化逻辑，当前实现内置抖宝词典策略与透传策略。
 *  - 相比直接在组件中硬编码判断，该方式便于后续扩展其他模型格式或在测试中注入自定义策略。
 * 影响范围：
 *  - ChatView 等消费助手回复的界面将统一通过格式化器输出内容；
 *  - 新增策略只需注册到工厂，无需侵入调用方。
 * 演进与TODO：
 *  - 后续可引入配置驱动策略选择或接入 A/B 开关，支持灰度验证不同格式化方案。
 */
import {
  createStreamingTextBuffer,
  polishDictionaryMarkdown,
} from "@shared/utils";

/**
 * 背景：
 *  - 抖宝词典在 2024Q4 起持续扩展字段集，除早期的 senses/example 外，又新增英文释义、适用人群等模块。
 * 关键决策与取舍：
 *  - 采用字段名信号+命中计数策略，既能覆盖大小写差异，又能避免单个关键词偶然出现导致误判。
 *  - 选取当前最稳定的结构化段落标题（含历史与新增字段），并统一使用不区分大小写的冒号匹配形式。
 * 演进与维护：
 *  - 若后续 Doubao 字段再演进，只需在下方数组补充新的字段名正则，同时评估是否需要调整最小命中阈值，
 *    确保至少两项结构化信号成立后再触发字典格式化，维持高置信度识别。
 */
const DOUBAO_DICTIONARY_SIGNAL_PATTERNS = Object.freeze([
  /\bSenses\b/i,
  /\bExample\d*\s*:/i,
  /\bUsageInsight\s*:/i,
  /\bRegister\s*:/i,
  /\bEntryType\s*:/i,
  /\bEnglishDefinitions?\s*:/i,
  /\bRecommendedAudience\s*:/i,
  /\bCollocations?\s*:/i,
  /\bDerivatives?\s*:/i,
  /\bPracticePrompts?\s*:/i,
]);

const MIN_DOUBAO_DICTIONARY_SIGNAL_MATCHES = 2;

const FALLBACK_STRATEGY = {
  matches() {
    return true;
  },
  format(text) {
    return text;
  },
};

function createDoubaoDictionaryStrategy() {
  return {
    matches(text) {
      if (!text || text.length < 20) {
        return false;
      }
      const matches = DOUBAO_DICTIONARY_SIGNAL_PATTERNS.filter((pattern) =>
        pattern.test(text),
      ).length;
      return matches >= MIN_DOUBAO_DICTIONARY_SIGNAL_MATCHES;
    },
    format(text) {
      return polishDictionaryMarkdown(text);
    },
  };
}

/**
 * 意图：提供可复用的助手消息格式化器，按流式片段累计原始文本并执行匹配策略。
 * 输入：可选的自定义策略列表（按优先级排列）。
 * 输出：暴露 append 与 reset 方法，供上层在流式读取时增量格式化。
 * 流程：
 *  1) 累积原始 chunk 至内部缓冲；
 *  2) 选取首个 matches 的策略（默认透传策略兜底）；
 *  3) 返回策略格式化后的文本，用于即时渲染。
 * 错误处理：策略抛错时沿用原文本，避免阻断主流程。
 * 复杂度：每次 append 线性扫描策略列表，整体 O(n * m)（n 为策略数，m 为文本长度），现阶段可接受。
 */
export function createAssistantMessageFormatter({ strategies } = {}) {
  const availableStrategies = strategies ?? [
    createDoubaoDictionaryStrategy(),
    FALLBACK_STRATEGY,
  ];
  const streamBuffer = createStreamingTextBuffer();

  function applyStrategies(text) {
    for (const strategy of availableStrategies) {
      try {
        if (strategy.matches(text)) {
          return strategy.format(text);
        }
      } catch (error) {
        console.error("[assistantFormatter] strategy failed", error);
      }
    }
    return text;
  }

  return {
    append(chunk) {
      const aggregated = streamBuffer.append(chunk);
      return applyStrategies(aggregated);
    },
    reset() {
      streamBuffer.reset();
    },
  };
}

export function __internal__createDoubaoDictionaryStrategy() {
  return createDoubaoDictionaryStrategy();
}
