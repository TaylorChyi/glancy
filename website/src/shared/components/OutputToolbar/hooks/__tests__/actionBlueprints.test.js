import { jest } from "@jest/globals";
import ThemeIcon from "@shared/components/ui/Icon";

import { buildBlueprintItems } from "../actionBlueprints";

describe("buildBlueprintItems", () => {
  /**
   * 测试目标：确认蓝图仅输出删除与举报动作，并沿用 ThemeIcon 渲染。
   * 前置条件：提供翻译文案且删除/举报处理函数可用。
   * 步骤：构造启用状态的上下文后生成蓝图。
   * 断言：
   *  - 仅包含 delete 与 report 两个动作键；
   *  - 图标元素类型均为 ThemeIcon；
   *  - 对应处理函数保持可调用。
   * 边界/异常：当动作禁用或无用户时应返回空数组（交由其他测试覆盖）。
   */
  test("exposes delete and report actions without favorites", () => {
    const translator = {
      deleteButton: "删除",
      report: "举报",
    };

    const actionContext = {
      translator,
      canDelete: true,
      onDelete: jest.fn(),
      canReport: true,
      onReport: jest.fn(),
      disabled: false,
    };

    const items = buildBlueprintItems({
      actionContext,
      disabled: false,
      user: { id: "user" },
    });

    const keys = items.map((item) => item.key);
    expect(keys).toEqual(["delete", "report"]);
    items.forEach((item) => {
      expect(item.icon.type).toBe(ThemeIcon);
      expect(typeof item.onClick).toBe("function");
    });
  });
});
