import { jest } from "@jest/globals";

jest.unstable_mockModule("@shared/utils", () => ({
  polishDictionaryMarkdown: jest.fn((value) => `polished:${value}`),
}));

const normalizerModule = await import("../dictionaryMarkdownNormalizer.js");
const utilsModule = await import("@shared/utils");

const {
  createDictionaryMarkdownNormalizer,
  normalizeDictionaryMarkdown,
  normalizeMarkdownEntity,
} = normalizerModule;
const { polishDictionaryMarkdown } = utilsModule;

/**
 * 测试目标：非字符串输入需安全回退为空串，避免渲染阶段出现 [object Object]。
 * 前置条件：调用 normalizeDictionaryMarkdown 传入 undefined/null/对象。
 * 步骤：分别执行并收集返回值。
 * 断言：
 *  - 每次调用均返回空字符串；
 * 边界/异常：覆盖 undefined 与对象两类非法输入。
 */
test("GivenNonStringInput_WhenNormalizeInvoked_ShouldReturnEmptyString", () => {
  expect(normalizeDictionaryMarkdown(undefined)).toBe("");
  expect(normalizeDictionaryMarkdown(null)).toBe("");
  expect(normalizeDictionaryMarkdown({ markdown: "value" })).toBe("");
});

/**
 * 测试目标：自定义 pipeline 应按顺序执行，产出最终归一化结果。
 * 前置条件：构造包含两个步骤的 pipeline，第一个追加标记，第二个转大写。
 * 步骤：使用 createDictionaryMarkdownNormalizer 创建实例后执行 normalize。
 * 断言：
 *  - 返回值匹配预期的串联效果。
 * 边界/异常：验证 pipeline 中含非函数时会被过滤。
 */
test("GivenCustomPipeline_WhenNormalizeInvoked_ShouldApplySequentially", () => {
  const pipeline = [
    (value) => `${value}-step1`,
    null,
    (value) => value.toUpperCase(),
  ];
  const normalizer = createDictionaryMarkdownNormalizer({ pipeline });
  expect(normalizer.normalize("seed")).toBe("SEED-STEP1");
});

/**
 * 测试目标：normalizeMarkdownEntity 在 markdown 发生变化时应返回浅拷贝。
 * 前置条件：传入包含 markdown 的对象，并让底层 polish mock 返回不同值。
 * 步骤：执行 normalizeMarkdownEntity 并检查引用与字段。
 * 断言：
 *  - 返回对象不与原引用相同；
 *  - markdown 字段被替换为 mock 结果。
 * 边界/异常：确保缺失 markdown 时返回原对象。
 */
test("GivenEntityWithMarkdown_WhenNormalized_ShouldReturnClonedResult", () => {
  polishDictionaryMarkdown.mockImplementationOnce((value) => `norm:${value}`);
  const original = { id: "v1", markdown: "**raw**" };
  const normalized = normalizeMarkdownEntity(original);
  expect(normalized).not.toBe(original);
  expect(normalized.markdown).toBe("norm:**raw**");
  expect(normalizeMarkdownEntity({ id: "v2" })).toEqual({ id: "v2" });
});
