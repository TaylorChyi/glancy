import {
  FALLBACK_WAITING_FRAME,
  buildFrameSequence,
} from "../waitingFrameAssets";

describe("buildFrameSequence", () => {
  test("buildFrameSequence_WhenResourcesPresent_SortsByNumericSuffix", () => {
    /**
     * 测试目标：验证资源条目可按文件名中的序号排序，生成稳定的帧序列。
     * 前置条件：提供三个乱序的序列帧路径，并确保模块导出为字符串 URL。
     * 步骤：
     *  1) 调用 buildFrameSequence 传入乱序资源映射；
     *  2) 读取返回值用于断言顺序。
     * 断言：
     *  - 结果序列严格按 1、2、3 排序，失败时给出具体索引。
     * 边界/异常：
     *  - 若解析失败应回落到 fallback，本用例不触发该路径。
     */
    const sequence = buildFrameSequence({
      "@/assets/waiting-frame-3.svg": "frame-3-url",
      "@/assets/waiting-frame-1.svg": "frame-1-url",
      "@/assets/waiting-frame-2.svg": "frame-2-url",
    });

    expect(sequence).toHaveLength(3);
    expect(sequence[0]).toBe("frame-1-url");
    expect(sequence[1]).toBe("frame-2-url");
    expect(sequence[2]).toBe("frame-3-url");
  });

  test("buildFrameSequence_WhenResourcesMissing_ReturnsFallbackSingleton", () => {
    /**
     * 测试目标：确保当资源映射为空或无法解析时，函数返回仅包含 fallback 的序列。
     * 前置条件：传入空对象。
     * 步骤：
     *  1) 调用 buildFrameSequence，未提供任何有效资源；
     *  2) 检查返回值内容。
     * 断言：
     *  - 结果长度为 1，且唯一元素等于预期 fallback。
     * 边界/异常：
     *  - fallback 缺失将导致序列为空，该情况在实现中被禁止。
     */
    const sequence = buildFrameSequence({}, "fallback-value");

    expect(sequence).toHaveLength(1);
    expect(sequence[0]).toBe("fallback-value");
  });

  test("buildFrameSequence_WhenEntriesInvalid_IgnoresAndFallsBack", () => {
    /**
     * 测试目标：遇到无序号文件或无效模块时应忽略，并在没有有效帧时回落至 fallback。
     * 前置条件：传入包含无序号文件与缺失 default 的模块对象。
     * 步骤：
     *  1) 构造包含无效条目的资源映射；
     *  2) 调用 buildFrameSequence 并观察返回结果。
     * 断言：
     *  - 返回值只包含 fallback，证明无效条目被过滤。
     * 边界/异常：
     *  - 若存在一个有效条目则不会触发 fallback，本用例用于验证全部无效的场景。
     */
    const sequence = buildFrameSequence(
      {
        "@/assets/waiting-frame-a.svg": "unparsable",
        "@/assets/other.svg": "irrelevant",
        "@/assets/waiting-frame-4.svg": { foo: "bar" },
      },
      FALLBACK_WAITING_FRAME,
    );

    expect(sequence).toHaveLength(1);
    expect(sequence[0]).toBe(FALLBACK_WAITING_FRAME);
  });
});
