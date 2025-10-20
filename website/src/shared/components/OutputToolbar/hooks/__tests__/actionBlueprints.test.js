import ThemeIcon from "@shared/components/ui/Icon";

import { buildBlueprintItems } from "../actionBlueprints";

describe("buildBlueprintItems", () => {
  /**
   * 测试目标：验证收藏动作的图标工厂在状态变化时输出正确的 ThemeIcon 变体。
   * 前置条件：提供翻译文案、收藏/删除/举报能力均开启且处理函数有效。
   * 步骤：
   *  1) 构造 favorited=true 的上下文并生成蓝图条目。
   *  2) 切换 favorited=false 再生成蓝图条目。
   * 断言：
   *  - 收藏按钮的图标类型为 ThemeIcon。
   *  - 收藏按钮在收藏状态为 star-solid，未收藏为 star-outline。
   * 边界/异常：
   *  - 若未来扩展无用户场景，可在此补充缺省图标断言。
   */
  test("switches favorite icon variant via factory", () => {
    const translator = {
      favoriteAction: "收藏",
      favoriteRemove: "取消收藏",
      deleteButton: "删除",
      report: "举报",
    };

    const baseContext = {
      translator,
      canFavorite: true,
      onToggleFavorite: () => {},
      canDelete: true,
      onDelete: () => {},
      canReport: true,
      onReport: () => {},
    };

    const activeItems = buildBlueprintItems({
      actionContext: { ...baseContext, favorited: true },
      disabled: false,
      user: { id: "user" },
      shareItem: null,
    });
    const activeFavorite = activeItems.find((item) => item.key === "favorite");

    expect(activeFavorite?.icon.type).toBe(ThemeIcon);
    expect(activeFavorite?.icon.props.name).toBe("star-solid");

    const inactiveItems = buildBlueprintItems({
      actionContext: { ...baseContext, favorited: false },
      disabled: false,
      user: { id: "user" },
      shareItem: null,
    });
    const inactiveFavorite = inactiveItems.find((item) => item.key === "favorite");

    expect(inactiveFavorite?.icon.type).toBe(ThemeIcon);
    expect(inactiveFavorite?.icon.props.name).toBe("star-outline");
  });
});
