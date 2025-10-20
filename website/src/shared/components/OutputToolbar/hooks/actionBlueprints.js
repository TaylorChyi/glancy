/**
 * 背景：
 *  - 动作蓝图需集中定义以便扩展与复用。
 * 目的：
 *  - 暴露按钮蓝图及构建逻辑，供 useToolbarActionsModel 组合使用。
 * 关键决策与取舍：
 *  - 在此文件中保留图标定义，避免在模型 Hook 中散落 JSX；
 *  - 仅负责纯数据组合，不涉及状态。
 * 影响范围：
 *  - ToolbarActions 与潜在复用者。
 * 演进与TODO：
 *  - 后续新增动作时请在此扩展并补充相应策略。
 */
import ThemeIcon from "@shared/components/ui/Icon";

export const ACTION_BLUEPRINTS = [
  {
    key: "favorite",
    variant: "favorite",
    requiresUser: true,
    hiddenWhenInactive: false,
    getLabel: ({ translator, favorited }) =>
      favorited
        ? translator.favoriteRemove || translator.favoriteAction || "Favorite"
        : translator.favoriteAction || "Favorite",
    getIcon: ({ favorited }) =>
      favorited ? (
        <ThemeIcon name="star-solid" width={22} height={22} />
      ) : (
        <ThemeIcon name="star-outline" width={22} height={22} />
      ),
    isActive: ({ favorited }) => Boolean(favorited),
    canUse: ({ canFavorite }) => Boolean(canFavorite),
    getHandler: ({ onToggleFavorite }) => onToggleFavorite,
  },
  {
    key: "delete",
    variant: "delete",
    requiresUser: true,
    hiddenWhenInactive: false,
    getLabel: ({ translator }) =>
      translator.deleteButton || translator.deleteAction || "Delete",
    getIcon: () => <ThemeIcon name="trash" width={20} height={20} />,
    canUse: ({ canDelete }) => Boolean(canDelete),
    getHandler: ({ onDelete }) => onDelete,
  },
  {
    key: "report",
    variant: "report",
    requiresUser: true,
    hiddenWhenInactive: true,
    getLabel: ({ translator }) => translator.report || "Report",
    getIcon: () => <ThemeIcon name="flag" width={20} height={20} />,
    canUse: ({ canReport }) => Boolean(canReport),
    getHandler: ({ onReport }) => onReport,
  },
];

export const buildBlueprintItems = ({
  actionContext,
  disabled,
  user,
  shareItem,
}) => {
  const items = [];

  ACTION_BLUEPRINTS.forEach((blueprint) => {
    const handler = blueprint.getHandler?.(actionContext);
    const label = blueprint.getLabel(actionContext);
    const canUseAction = blueprint.canUse?.(actionContext) ?? true;
    const hasUser = !blueprint.requiresUser || Boolean(user);
    const isHandlerFunction = typeof handler === "function";
    const itemDisabled =
      disabled || !hasUser || !canUseAction || !isHandlerFunction;

    if (blueprint.hiddenWhenInactive && itemDisabled) {
      return;
    }

    items.push({
      key: blueprint.key,
      label,
      icon: blueprint.getIcon(actionContext),
      onClick: handler,
      active: blueprint.isActive?.(actionContext) ?? false,
      variant: blueprint.variant,
      disabled: itemDisabled,
    });
  });

  if (shareItem) {
    const reportIndex = items.findIndex((item) => item.key === "report");
    if (reportIndex >= 0) {
      items.splice(reportIndex, 0, shareItem);
    } else {
      items.push(shareItem);
    }
  }

  return items;
};
