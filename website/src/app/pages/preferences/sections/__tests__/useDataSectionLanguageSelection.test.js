/**
 * 背景：
 *  - useDataSectionLanguageSelection 管理语言选项与选中状态，直接影响清理动作的准确性。
 * 目的：
 *  - 验证默认选中、选项变化以及清除判定等关键逻辑。
 * 关键决策与取舍：
 *  - 通过 renderHook 驱动 Hook，依靠 rerender 模拟历史数据变化，确保逻辑完备。
 * 影响范围：
 *  - 偏好设置数据分区的语言选择体验。
 */
import { act, renderHook } from "@testing-library/react";
import { useDataSectionLanguageSelection } from "../useDataSectionLanguageSelection.js";

const translations = {
  dictionaryTargetLanguageEnglish: "Bravo",
  dictionaryTargetLanguageChinese: "Alpha",
};

describe("useDataSectionLanguageSelection", () => {
  /**
   * 测试目标：验证 Hook 默认选中首个语言并支持切换。
   * 前置条件：提供包含多个语言的历史记录。
   * 步骤：
   *  1) 渲染 Hook 并读取初始选中值；
   *  2) 调用 selectLanguage 切换到其他选项。
   * 断言：
   *  - 初始值为排序后的首个语言；
   *  - 切换后 value 被归一化并更新；
   *  - canClear 在存在选项时为 true。
   * 边界/异常：
   *  - 输入大小写混合时也能正常工作。
   */
  it("Given history options when selecting language then normalizes value and exposes canClear", () => {
    const history = [{ language: "chinese" }, { language: "english" }];

    const { result } = renderHook(() =>
      useDataSectionLanguageSelection(history, translations),
    );

    expect(result.current.selectedLanguage).toBe("CHINESE");

    act(() => {
      result.current.selectLanguage("english");
    });

    expect(result.current.selectedLanguage).toBe("ENGLISH");
    expect(result.current.canClear).toBe(true);
  });

  /**
   * 测试目标：验证当选项被清空或发生变化时，Hook 能正确重置选中状态。
   * 前置条件：初始选项存在，其后 rerender 时传入空历史。
   * 步骤：
   *  1) 渲染 Hook 并确认初始值；
   *  2) rerender 传入空列表；
   *  3) 断言选中状态被重置。
   * 断言：
   *  - 无选项时 selectedLanguage 为空字符串；
   *  - canClear 也同步为 false。
   * 边界/异常：
   *  - 确保 rerender 后不会保留旧选项。
   */
  it("Given options removed when rerendered then clears selection and disables clear action", () => {
    const { result, rerender } = renderHook(
      ({ history }) => useDataSectionLanguageSelection(history, translations),
      {
        initialProps: {
          history: [{ language: "english" }],
        },
      },
    );

    expect(result.current.selectedLanguage).toBe("ENGLISH");

    rerender({ history: [] });

    expect(result.current.selectedLanguage).toBe("");
    expect(result.current.options).toHaveLength(0);
    expect(result.current.canClear).toBe(false);
  });
});
