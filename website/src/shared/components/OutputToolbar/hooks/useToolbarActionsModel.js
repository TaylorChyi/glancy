/**
 * 背景：
 *  - 动作区域需要在多种状态下组合按钮、分享菜单与权限控制。
 * 目的：
 *  - 以 ViewModel 形式输出动作列表与分享菜单状态，削减展示组件的复杂度。
 * 关键决策与取舍：
 *  - 延续策略数组描述动作（策略模式），以便未来扩展；
 *  - 在 Hook 内部统一计算复制按钮、分享项与蓝图衍生动作，保证输出契约稳定。
 * 影响范围：
 *  - ToolbarActions 组件及潜在复用者。
 * 演进与TODO：
 *  - 后续可在 ACTION_BLUEPRINTS 中新增项目以扩展动作列表。
 */
import { useMemo } from "react";
import { useShareMenuState } from "./useShareMenuState.js";
import { buildBlueprintItems } from "./actionBlueprints.js";
import {
  buildActionContext,
  createCopyItem,
  createShareItem,
} from "./actionFactories.js";

const useShareItem = (shareMenu, translator) =>
  useMemo(
    () => createShareItem({ shareMenu, translator }),
    [shareMenu, translator],
  );

const useActionContextMemo = ({
  translator,
  user,
  canDelete,
  onDelete,
  canReport,
  onReport,
  disabled,
}) =>
  useMemo(
    () =>
      buildActionContext({
        translator,
        user,
        canDelete,
        onDelete,
        canReport,
        onReport,
        disabled,
      }),
    [translator, user, canDelete, onDelete, canReport, onReport, disabled],
  );

const useBlueprintItemsMemo = ({ actionContext, disabled, user, shareItem }) =>
  useMemo(
    () =>
      buildBlueprintItems({
        actionContext,
        disabled,
        user,
        shareItem,
      }),
    [actionContext, disabled, user, shareItem],
  );

const useCopyItemMemo = ({
  translator,
  copyFeedbackState,
  isCopySuccess,
  disabled,
  canCopy,
  onCopy,
}) =>
  useMemo(
    () =>
      createCopyItem({
        translator,
        copyFeedbackState,
        isCopySuccess,
        disabled,
        canCopy,
        onCopy,
      }),
    [translator, copyFeedbackState, isCopySuccess, disabled, canCopy, onCopy],
  );

const useActionItemsMemo = ({ copyItem, blueprintItems }) =>
  useMemo(() => [copyItem, ...blueprintItems], [copyItem, blueprintItems]);

export function useToolbarActionsModel({
  translator,
  user,
  disabled,
  canCopy,
  onCopy,
  copyFeedbackState,
  isCopySuccess,
  canDelete,
  onDelete,
  canReport,
  onReport,
  canShare,
  shareModel,
}) {
  const shareMenu = useShareMenuState({ shareModel, canShare, disabled });

  const shareItem = useShareItem(shareMenu, translator);
  const actionContext = useActionContextMemo({
    translator,
    user,
    canDelete,
    onDelete,
    canReport,
    onReport,
    disabled,
  });
  const blueprintItems = useBlueprintItemsMemo({
    actionContext,
    disabled,
    user,
    shareItem,
  });
  const copyItem = useCopyItemMemo({
    translator,
    copyFeedbackState,
    isCopySuccess,
    disabled,
    canCopy,
    onCopy,
  });
  const items = useActionItemsMemo({ copyItem, blueprintItems });

  return { items, shareMenu, shareItem };
}
