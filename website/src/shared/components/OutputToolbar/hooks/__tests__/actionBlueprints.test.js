import ThemeIcon from "@shared/components/ui/Icon";

import { buildBlueprintItems } from "../actionBlueprints";

describe("buildBlueprintItems", () => {
  /**
   * 测试目标：验证删除动作在上下文允许时生成带图标的条目。
   * 前置条件：提供翻译文案、删除/举报能力均开启且处理函数有效。
   * 步骤：
   *  1) 构造允许删除的上下文并生成蓝图条目。
   * 断言：
   *  - 删除按钮的图标类型为 ThemeIcon。
   *  - 删除按钮在用户缺席时不会渲染。
   */
  test("emits delete action with themed icon when permitted", () => {
    const translator = {
      deleteButton: "删除",
      report: "举报",
    };

    const baseContext = {
      translator,
      canDelete: true,
      onDelete: () => {},
      canReport: true,
      onReport: () => {},
    };

    const itemsWithUser = buildBlueprintItems({
      actionContext: baseContext,
      disabled: false,
      user: { id: "user" },
      shareItem: null,
    });
    const deleteItem = itemsWithUser.find((item) => item.key === "delete");

    expect(deleteItem?.icon.type).toBe(ThemeIcon);

    const itemsWithoutUser = buildBlueprintItems({
      actionContext: baseContext,
      disabled: false,
      user: null,
      shareItem: null,
    });

    expect(
      itemsWithoutUser.find((item) => item.key === "delete"),
    ).toBeUndefined();
  });
});
