/**
 * 背景：
 *  - dataSectionToolkit 承载纯函数，需通过单测守护语言归一化与选项计算的正确性。
 * 目的：
 *  - 覆盖 normalizeLanguageValue 与 toLanguageOptions 的核心路径，确保后续重构可快速回归。
 * 关键决策与取舍：
 *  - 选用最小输入集合模拟边界情况，避免耦合其他模块；
 *  - 仅覆盖核心纯函数，保持测试运行速度。
 * 影响范围：
 *  - 偏好设置数据分区的数据治理逻辑。
 */
import { normalizeLanguageValue, toLanguageOptions } from "../dataSectionToolkit.js";

describe("dataSectionToolkit", () => {
  /**
   * 测试目标：验证 normalizeLanguageValue 能够处理空值与大小写转换。
   * 前置条件：提供 null 与小写字符串作为输入。
   * 步骤：
   *  1) 调用 normalizeLanguageValue 传入 null；
   *  2) 调用 normalizeLanguageValue 传入小写字符串。
   * 断言：
   *  - 当输入为 null 时返回空字符串；
   *  - 当输入为小写字符串时返回大写版本。
   * 边界/异常：
   *  - 空值路径确保不抛出异常。
   */
  it("Given nullable language when normalized then returns uppercase token or empty string", () => {
    expect(normalizeLanguageValue(null)).toBe("");
    expect(normalizeLanguageValue(undefined)).toBe("");
    expect(normalizeLanguageValue("english")).toBe("ENGLISH");
  });

  /**
   * 测试目标：验证 toLanguageOptions 能够去重、排序并使用翻译文案。
   * 前置条件：提供包含重复语言、空白与缺失翻译的历史记录集合。
   * 步骤：
   *  1) 调用 toLanguageOptions 生成选项；
   *  2) 记录返回顺序与标签。
   * 断言：
   *  - 返回列表去重且排除空白记录；
   *  - 标签优先使用翻译文案并按字典序排序；
   *  - 缺失翻译时回退至归一化标识。
   * 边界/异常：
   *  - 保证存在未知语言时仍可正常返回。
   */
  it("Given history with duplicates when mapped to options then returns sorted distinct entries", () => {
    const history = [
      { language: "english" },
      { language: "chinese" },
      { language: "english" },
      { language: "de" },
      { language: "  " },
      { language: null },
    ];
    const translations = {
      dictionaryTargetLanguageEnglish: "Bravo",
      dictionaryTargetLanguageChinese: "Alpha",
    };

    const options = toLanguageOptions(history, translations);

    expect(options).toEqual([
      { value: "CHINESE", label: "Alpha" },
      { value: "ENGLISH", label: "Bravo" },
      { value: "DE", label: "DE" },
    ]);
  });
});
