import {
  isMeaningfulValue,
  normalizeOptions,
  resolveDisplayState,
} from "../optionNormalizer.js";

describe("optionNormalizer", () => {
  it("normalizeOptions trims and filters invalid entries", () => {
    /**
     * 测试目标：验证 normalizeOptions 能过滤无效选项并裁剪文本。
     * 前置条件：输入包含空标签、空白描述及数字值。
     * 步骤：
     *  1) 调用 normalizeOptions 生成标准化列表。
     *  2) 对返回结果执行断言。
     * 断言：
     *  - 仅保留有效选项，并保留原始值供回传。
     * 边界/异常：
     *  - 输入包含 null、空数组、空白字符串。
     */
    const result = normalizeOptions([
      null,
      { value: 1, label: "  Alpha  " },
      { value: "", label: "  Beta  ", description: "  note  " },
      { value: 3, label: "   " },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      rawValue: 1,
      normalizedValue: "1",
      label: "Alpha",
      description: undefined,
    });
    expect(result[1]).toEqual({
      rawValue: "",
      normalizedValue: "Beta",
      label: "Beta",
      description: "note",
    });
  });

  it("resolveDisplayState prioritizes active option and placeholder", () => {
    /**
     * 测试目标：确保 resolveDisplayState 根据选中项或占位符返回正确标签。
     * 前置条件：提供包含当前值、占位符及候选项的上下文。
     * 步骤：
     *  1) 先计算标准化选项。
     *  2) 调用 resolveDisplayState 并读取结果。
     * 断言：
     *  - triggerLabel 优先选中项，其次占位符，最后回退首项。
     * 边界/异常：
     *  - 当前值不存在于选项中时返回占位符并标记 placeholder 状态。
     */
    const normalized = normalizeOptions([
      { value: "en", label: "English" },
      { value: "zh", label: "中文" },
    ]);

    const active = resolveDisplayState({
      options: normalized,
      normalizedValue: "zh",
      placeholder: "Choose",
    });

    expect(active.triggerLabel).toBe("中文");
    expect(active.isShowingPlaceholder).toBe(false);

    const placeholderState = resolveDisplayState({
      options: normalized,
      normalizedValue: "",
      placeholder: "  Pick one  ",
    });

    expect(placeholderState.triggerLabel).toBe("Pick one");
    expect(placeholderState.isShowingPlaceholder).toBe(true);
  });

  it("isMeaningfulValue treats trimmed non-empty strings as meaningful", () => {
    /**
     * 测试目标：校验 isMeaningfulValue 对不同输入的判定逻辑。
     * 前置条件：覆盖字符串、空白、非字符串与 undefined。
     * 步骤：
     *  1) 分别调用 isMeaningfulValue。
     *  2) 收集布尔结果。
     * 断言：
     *  - 非空字符串返回 true，其余情况返回 false。
     * 边界/异常：
     *  - 输入非字符串应直接判定为 false。
     */
    expect(isMeaningfulValue("  data ")).toBe(true);
    expect(isMeaningfulValue("   ")).toBe(false);
    expect(isMeaningfulValue(undefined)).toBe(false);
    expect(isMeaningfulValue(0)).toBe(false);
  });
});
