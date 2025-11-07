import { useRootConfig } from "./useRootConfig.js";
import { useLeftClusterModel } from "./useLeftClusterModel.js";
import { useToolbarActionsProps } from "./useToolbarActionsProps.js";

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
});

export const useOutputToolbarLayout = (props) => {
  const { rootProps, baseToolButtonClass } = useRootConfig(
    pickRootConfigInput(props),
  );
  const leftCluster = useLeftClusterModel(pickLeftClusterInput(props));
  const actionsProps = useToolbarActionsProps(pickActionsInput(props));

  return {
    rootProps,
    baseToolButtonClass,
    leftCluster,
    actionsProps,
  };
};
