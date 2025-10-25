/**
 * 背景：
 *  - OutputToolbar 的装配逻辑需要组合多段派生状态，原本散落在入口文件中导致复杂度高。
 * 目的：
 *  - 提供集中式的布局模型 Hook，将样式、版本、动作等逻辑解耦出主组件。
 * 关键决策与取舍：
 *  - 保留内联 Hook 以获得 memo 化优势，同时避免在组件中重复创建派生对象；
 *  - 复用 CSS Module 生成基础类，确保视觉标记一致性。
 * 影响范围：
 *  - OutputToolbar 主组件使用的布局数据。
 * 演进与TODO：
 *  - 若未来新增布局区域，可在此 Hook 内部扩展返回结构。
 */
import { useVersionViewModel } from "./useVersionViewModel.js";
import { useRootConfig } from "./useRootConfig.js";
import { useLeftClusterModel } from "./useLeftClusterModel.js";
import { useToolbarActionsProps } from "./useToolbarActionsProps.js";
import { useVersionDialProps } from "./useVersionDialProps.js";

const pickVersionViewModelInput = (props) => ({
  versions: props.versions,
  activeVersionId: props.activeVersionId,
  disabled: props.disabled,
  translator: props.translator,
});

const pickRootConfigInput = (props) => ({
  className: props.className,
  toolbarRole: props.toolbarRole,
  ariaLabel: props.ariaLabel,
});

const pickLeftClusterInput = (props) => ({
  term: props.term,
  lang: props.lang,
  disabled: props.disabled,
  onReoutput: props.onReoutput,
  ttsComponent: props.ttsComponent,
  translator: props.translator,
});

const pickActionsInput = (props) => ({
  translator: props.translator,
  user: props.user,
  disabled: props.disabled,
  canCopy: props.canCopy,
  onCopy: props.onCopy,
  copyFeedbackState: props.copyFeedbackState,
  isCopySuccess: props.isCopySuccess,
  canDelete: props.canDelete,
  onDelete: props.onDelete,
  canReport: props.canReport,
  onReport: props.onReport,
  canShare: props.canShare,
  shareModel: props.shareModel,
});

const pickVersionDialInput = ({
  props,
  versionViewModel,
  baseToolButtonClass,
}) => ({
  versionViewModel,
  baseToolButtonClass,
  onNavigate: props.onNavigate,
  translator: props.translator,
});

export const useOutputToolbarLayout = (props) => {
  const versionViewModel = useVersionViewModel(
    pickVersionViewModelInput(props),
  );
  const { rootProps, baseToolButtonClass } = useRootConfig(
    pickRootConfigInput(props),
  );
  const leftCluster = useLeftClusterModel(pickLeftClusterInput(props));
  const actionsProps = useToolbarActionsProps(pickActionsInput(props));
  const versionDialProps = useVersionDialProps(
    pickVersionDialInput({ props, versionViewModel, baseToolButtonClass }),
  );

  return {
    rootProps,
    baseToolButtonClass,
    leftCluster,
    actionsProps,
    versionDialProps,
  };
};
