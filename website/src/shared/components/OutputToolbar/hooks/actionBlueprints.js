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

const resolveHandler = (blueprint, actionContext) =>
  blueprint.getHandler?.(actionContext);

const resolveLabel = (blueprint, actionContext) =>
  blueprint.getLabel(actionContext);

const isHiddenWhenInactive = (blueprint) => Boolean(blueprint.hiddenWhenInactive);

const canRenderForUser = (blueprint, user) =>
  !blueprint.requiresUser || Boolean(user);

const canUseBlueprint = (blueprint, actionContext) =>
  blueprint.canUse?.(actionContext) ?? true;

const isValidHandler = (handler) => typeof handler === "function";

const isBlueprintDisabled = ({
  blueprint,
  handler,
  disabled,
  user,
  actionContext,
}) =>
  disabled ||
  !canRenderForUser(blueprint, user) ||
  !canUseBlueprint(blueprint, actionContext) ||
  !isValidHandler(handler);

const shouldIncludeBlueprint = (options) =>
  !(isHiddenWhenInactive(options.blueprint) && options.itemDisabled);

const createBlueprintItem = ({
  blueprint,
  actionContext,
  handler,
  itemDisabled,
}) => ({
  key: blueprint.key,
  label: resolveLabel(blueprint, actionContext),
  icon: blueprint.getIcon(actionContext),
  onClick: handler,
  active: blueprint.isActive?.(actionContext) ?? false,
  variant: blueprint.variant,
  disabled: itemDisabled,
});

export const buildBlueprintItems = ({ actionContext, disabled, user }) =>
  ACTION_BLUEPRINTS.reduce((items, blueprint) => {
    const handler = resolveHandler(blueprint, actionContext);
    const itemDisabled = isBlueprintDisabled({
      blueprint,
      handler,
      disabled,
      user,
      actionContext,
    });

    if (!shouldIncludeBlueprint({ blueprint, itemDisabled })) {
      return items;
    }

    const item = createBlueprintItem({
      blueprint,
      actionContext,
      handler,
      itemDisabled,
    });

    items.push(item);
    return items;
  }, []);
