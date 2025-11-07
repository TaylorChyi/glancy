import PropTypes from "prop-types";
import { memo } from "react";
import { TtsButton } from "@shared/components";
import { useLanguage, useUser } from "@core/context";
import LeftCluster from "./parts/LeftCluster.jsx";
import ToolbarActions from "./parts/ToolbarActions.jsx";
import { useOutputToolbarLayout } from "./hooks/useOutputToolbarLayout.js";


const mapPropsToLayoutInput = ({ props, translator, user }) => {
  const {
    renderRoot: _ignoredRenderRoot,
    role: toolbarRole = "toolbar",
    ariaLabel = "词条工具栏",
    ...rest
  } = props;

  return {
    ...rest,
    toolbarRole,
    ariaLabel,
    translator,
    user,
  };
};


const renderLeftCluster = ({ leftCluster, baseToolButtonClass }) =>
  leftCluster.shouldRender && leftCluster.props ? (
    <LeftCluster
      {...leftCluster.props}
      baseToolButtonClass={baseToolButtonClass}
    />
  ) : null;


const buildToolbarChildren = (layout) => (
  <>
    {renderLeftCluster({
      leftCluster: layout.leftCluster,
      baseToolButtonClass: layout.baseToolButtonClass,
    })}
    <ToolbarActions
      {...layout.actionsProps}
      baseToolButtonClass={layout.baseToolButtonClass}
    />
  </>
);


const defaultRenderRoot = ({
  className,
  role,
  ariaLabel,
  dataTestId,
  children,
}) => (
  <div
    className={className}
    role={role}
    aria-label={ariaLabel}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

const OUTPUT_TOOLBAR_DEFAULTS = {
  term: "",
  lang: "en",
  onReoutput: undefined,
  disabled: false,
  ttsComponent: TtsButton,
  onCopy: undefined,
  canCopy: false,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  canDelete: false,
  onDelete: undefined,
  canReport: false,
  onReport: undefined,
  className: "",
  role: "toolbar",
  ariaLabel: "词条工具栏",
  renderRoot: defaultRenderRoot,
};


const normalizeToolbarProps = (props) =>
  Object.keys(OUTPUT_TOOLBAR_DEFAULTS).reduce(
    (acc, key) => ({
      ...acc,
      [key]:
        props[key] === undefined ? OUTPUT_TOOLBAR_DEFAULTS[key] : props[key],
    }),
    { ...props },
  );

function OutputToolbar(props) {
  const normalizedProps = normalizeToolbarProps(props);
  const { renderRoot } = normalizedProps;
  const { t } = useLanguage();
  const { user } = useUser();

  const layout = useOutputToolbarLayout(
    mapPropsToLayoutInput({ props: normalizedProps, translator: t, user }),
  );

  return renderRoot({
    ...layout.rootProps,
    children: buildToolbarChildren(layout),
  });
}

OutputToolbar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  onReoutput: PropTypes.func,
  disabled: PropTypes.bool,
  ttsComponent: PropTypes.elementType,
  onCopy: PropTypes.func,
  canCopy: PropTypes.bool,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
  className: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  renderRoot: PropTypes.func,
};

OutputToolbar.defaultProps = OUTPUT_TOOLBAR_DEFAULTS;

export default memo(OutputToolbar);
