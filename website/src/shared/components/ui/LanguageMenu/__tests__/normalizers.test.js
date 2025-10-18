import { jest } from "@jest/globals";

jest.unstable_mockModule("@shared/utils/language.js", () => ({
  resolveLanguageBadge: jest.fn((value) => `badge-${value}`),
}));

const { resolveLanguageBadge } = await import("@shared/utils/language.js");
const {
  resolveComparableValue,
  resolveCurrentOption,
  resolveNormalizedValue,
  toNormalizedOptions,
} = await import("../normalizers.js");

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * 测试目标：normalizeValue 策略被正确执行并回传结果。
 * 前置条件：提供自定义策略函数。
 * 步骤：
 *  1) 调用 resolveNormalizedValue 并断言策略被触发。
 * 断言：
 *  - 策略接收原始值并返回预期字符串。
 * 边界/异常：
 *  - 若策略未执行则返回值会与预期不符。
 */
test("Given strategy hook When resolving value Then delegate to normalize callback", () => {
  const normalize = jest.fn((raw) => `${String(raw)}-normalized`);

  const result = resolveNormalizedValue("en", normalize);

  expect(normalize).toHaveBeenCalledWith("en");
  expect(result).toBe("en-normalized");
});

/**
 * 测试目标：原始选项经过归一化后生成徽章并过滤非法条目。
 * 前置条件：混入无效 label 与 description 的选项。
 * 步骤：
 *  1) 调用 toNormalizedOptions 并校验输出数组。
 * 断言：
 *  - 仅保留合法项且调用 resolveLanguageBadge。
 * 边界/异常：
 *  - 非法 label 或缺失值应被过滤。
 */
test("Given raw options When normalized Then produce badge enriched items", () => {
  const normalize = (value) => value;
  const options = [
    { value: "en", label: "English", description: " primary " },
    { value: null, label: "" },
    { value: "zh", label: "Chinese" },
  ];

  const result = toNormalizedOptions(options, normalize);

  expect(resolveLanguageBadge).toHaveBeenCalledWith("EN");
  expect(resolveLanguageBadge).toHaveBeenCalledWith("ZH");
  expect(result).toEqual([
    {
      value: "EN",
      badge: "badge-EN",
      label: "English",
      description: "primary",
    },
    {
      value: "ZH",
      badge: "badge-ZH",
      label: "Chinese",
      description: undefined,
    },
  ]);
});

/**
 * 测试目标：当前选项解析应支持精确匹配与首项兜底。
 * 前置条件：提供归一化后的选项列表。
 * 步骤：
 *  1) 调用 resolveCurrentOption 测试匹配与兜底。
 * 断言：
 *  - 匹配成功返回对应项，未匹配返回首项。
 * 边界/异常：
 *  - 空数组时返回 undefined。
 */
test("Given normalized options When resolving current item Then fallback to first entry", () => {
  const normalized = [
    { value: "EN", label: "English" },
    { value: "ZH", label: "Chinese" },
  ];

  expect(resolveCurrentOption(normalized, "ZH")).toEqual({
    value: "ZH",
    label: "Chinese",
  });
  expect(resolveCurrentOption(normalized, "JP")).toEqual({
    value: "EN",
    label: "English",
  });
  expect(resolveCurrentOption([], "EN")).toBeUndefined();
});

/**
 * 测试目标：可比较值应统一转为大写字符串，空值返回 undefined。
 * 前置条件：传入大小写混合与 undefined。
 * 步骤：
 *  1) 调用 resolveComparableValue 分别断言结果。
 * 断言：
 *  - 字符串被转为大写，空值回传 undefined。
 * 边界/异常：
 *  - 归一化策略返回 null 时亦应得到 undefined。
 */
test("Given raw selection When resolving comparable value Then uppercase or omit", () => {
  expect(resolveComparableValue("en", (value) => value)).toBe("EN");
  expect(resolveComparableValue(undefined, (value) => value)).toBeUndefined();
  expect(resolveComparableValue("zh", () => null)).toBeUndefined();
});
