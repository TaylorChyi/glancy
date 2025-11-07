import { resolveDeleteIcon, resolveReportIcon } from "./iconFactories";

export const ACTION_BLUEPRINTS = [
  {
    key: "delete",
    variant: "delete",
    requiresUser: true,
    hiddenWhenInactive: false,
    getLabel: ({ translator }) =>
      translator.deleteButton || translator.deleteAction || "Delete",
    getIcon: resolveDeleteIcon,
    canUse: ({ canDelete }) => Boolean(canDelete),
    getHandler: ({ onDelete }) => onDelete,
  },
  {
    key: "report",
    variant: "report",
    requiresUser: true,
    hiddenWhenInactive: true,
    getLabel: ({ translator }) => translator.report || "Report",
    getIcon: resolveReportIcon,
    canUse: ({ canReport }) => Boolean(canReport),
    getHandler: ({ onReport }) => onReport,
  },
];

export const buildBlueprintItems = ({ actionContext, disabled, user }) => {
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

  return items;
};
