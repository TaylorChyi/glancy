import ThemeIcon from "@shared/components/ui/Icon";

import { buildBlueprintItems } from "../actionBlueprints";

describe("buildBlueprintItems", () => {
  /**
   * 测试目标：验证删除与举报蓝图在权限开启时正确输出 ThemeIcon 并保留可用状态。
   * 前置条件：提供完整翻译文案、删除/举报处理函数有效且禁用标记为 false。
   * 步骤：
   *  1) 构造可用的 actionContext 并生成蓝图条目集合；
   *  2) 找到 delete 与 report 项并比对属性；
   *  3) 构造无权限上下文确认举报项会被隐藏。
   * 断言：
   *  - 删除/举报按钮的 icon 均为 ThemeIcon 且名称正确；
   *  - 删除按钮保持可用，举报权限关闭时不渲染条目。
   * 边界/异常：
   *  - 若未来新增其他权限判断，需要扩展断言覆盖隐藏策略。
   */
  test("whenActionsEnabled_returnsDeleteAndReportBlueprints", () => {
    const translator = {
      deleteButton: "删除",
      report: "举报",
    };

    const actionContext = {
      translator,
      canDelete: true,
      onDelete: () => {},
      canReport: true,
      onReport: () => {},
    };

    const items = buildBlueprintItems({
      actionContext,
      disabled: false,
      user: { id: "user" },
    });

    const deleteItem = items.find((item) => item.key === "delete");
    const reportItem = items.find((item) => item.key === "report");

    expect(deleteItem?.icon.type).toBe(ThemeIcon);
    expect(deleteItem?.icon.props.name).toBe("trash");
    expect(deleteItem?.disabled).toBe(false);

    expect(reportItem?.icon.type).toBe(ThemeIcon);
    expect(reportItem?.icon.props.name).toBe("flag");

    const withoutReport = buildBlueprintItems({
      actionContext: { ...actionContext, canReport: false },
      disabled: false,
      user: { id: "user" },
    });

    expect(withoutReport.find((item) => item.key === "report")).toBeUndefined();
  });
});
