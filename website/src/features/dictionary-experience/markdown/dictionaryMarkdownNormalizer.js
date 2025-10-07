/**
 * 背景：
 *  - 词典体验在流式与静态阶段分别维护 Markdown 字符串，历史上两处各自调用 polishDictionaryMarkdown，存在漂移风险。
 * 目的：
 *  - 以可扩展的归一化服务统一 Markdown 预处理，确保 streaming 预览与最终渲染沿用同一逻辑，从而保持视觉与语义一致。
 * 关键决策与取舍：
 *  - 采用“责任链/策略”混合模式，通过可配置的管线依次执行清洗步骤，当前仅内置 polishDictionaryMarkdown，未来可按需扩展。
 *  - 保持函数式接口（normalize）以便 Hook 与组件调用，无需知晓内部策略细节，降低耦合度。
 * 影响范围：
 *  - useDictionaryExperience 在流式阶段更新 preview/finalText；DictionaryEntry 渲染 Markdown 文本。
 * 演进与TODO：
 *  - 后续若需按语言切换策略，可在 createDictionaryMarkdownNormalizer 的入参中注入多策略选择器。
 */
import { polishDictionaryMarkdown } from "@/utils";

const DEFAULT_PIPELINE = Object.freeze([polishDictionaryMarkdown]);

/**
 * 意图：构建可扩展的 Markdown 归一化器，保证输入经过同一序列的清洗步骤。
 * 输入：可选自定义 pipeline（函数数组），按顺序处理字符串；
 * 输出：暴露 normalize 方法，返回归一化后的字符串。
 * 流程：
 *  1) 过滤非法步骤并固定为不可变数组；
 *  2) 校验输入，仅处理字符串，其他类型返回空串；
 *  3) 依次执行 pipeline，若某一步返回非字符串或抛错，则保留上一步结果。
 * 错误处理：单步失败时吞掉异常并记录控制台错误，避免阻断主流程。
 * 复杂度：O(n)（n 为步骤数），默认单步。
 */
export function createDictionaryMarkdownNormalizer({ pipeline } = {}) {
  const steps = Array.isArray(pipeline) && pipeline.length > 0
    ? pipeline.filter((step) => typeof step === "function")
    : DEFAULT_PIPELINE;

  return {
    normalize(source) {
      if (typeof source !== "string") {
        return "";
      }

      return steps.reduce((acc, step) => {
        if (typeof acc !== "string") {
          return "";
        }
        try {
          const next = step(acc);
          return typeof next === "string" ? next : acc;
        } catch (error) {
          console.error("[dictionaryMarkdownNormalizer] step failed", error);
          return acc;
        }
      }, source);
    },
  };
}

const defaultNormalizer = createDictionaryMarkdownNormalizer();

export function normalizeDictionaryMarkdown(source) {
  return defaultNormalizer.normalize(source);
}

/**
 * 意图：在不破坏引用的前提下，统一处理对象上的 markdown 字段。
 * 输入：包含 markdown 属性的对象；
 * 输出：若 markdown 为字符串则返回归一化后的浅拷贝，否则返回原对象。
 */
export function normalizeMarkdownEntity(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return candidate;
  }
  const { markdown } = candidate;
  if (typeof markdown !== "string") {
    return candidate;
  }
  const normalized = normalizeDictionaryMarkdown(markdown);
  if (normalized === markdown) {
    return candidate;
  }
  return { ...candidate, markdown: normalized };
}

export const __INTERNAL__ = Object.freeze({
  DEFAULT_PIPELINE,
});
