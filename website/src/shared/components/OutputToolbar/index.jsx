/**
 * 背景：
 *  - OutputToolbar 长期承载多种交互，原文件体量过大导致被 ESLint 结构化规则豁免。
 * 目的：
 *  - 通过组合模式拆分子组件与状态 Hook，让主入口聚焦装配并恢复结构化规则校验。
 * 关键决策与取舍：
 *  - 引入 LeftCluster、ToolbarActions、VersionDial 三段布局组件，持续复用既有视觉标记；
 *  - 采用 useVersionViewModel 提供可复用的派生数据，避免一次性重构。
 * 影响范围：
 *  - 词典页输出工具栏及依赖其交互的页面。
 * 演进与TODO：
 *  - 若未来扩充按钮簇，可在 ToolbarActions 的策略表追加新动作。
 */
import PropTypes from "prop-types";
import { memo } from "react";
import { TtsButton } from "@shared/components";
import { useLanguage, useUser } from "@core/context";
import LeftCluster from "./parts/LeftCluster.jsx";
import ToolbarActions from "./parts/ToolbarActions.jsx";
import VersionDial from "./parts/VersionDial.jsx";
import { useOutputToolbarLayout } from "./hooks/useOutputToolbarLayout.js";

/**
 * 背景：
 *  - OutputToolbar 需要将大量 Prop 聚合为布局模型，直接在组件内部组装导致函数体冗长。
 * 目的：
 *  - 借助纯函数集中处理 prop 到布局入参的映射，保持组件聚焦于依赖注入与渲染装配。
 * 关键决策与取舍：
 *  - 选择显式 mapPropsToLayoutInput，而非隐式解构并传递 rest，便于未来在此扩展特性开关或默认值。
 *    同时避免在组件内部重复列举字段，降低 cyclomatic complexity。
 */
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

/**
 * 背景：
 *  - 左侧按钮簇是否渲染由布局层判定，直接在 JSX 中堆叠条件增加圈复杂度。
 * 目的：
 *  - 通过小型渲染器隔离条件判断，令主要组件保持声明式结构。
 * 关键决策与取舍：
 *  - 使用纯函数而非子组件，避免额外的 React devtools 节点并保持性能预测性。
 */
const renderLeftCluster = ({ leftCluster, baseToolButtonClass }) =>
  leftCluster.shouldRender && leftCluster.props ? (
    <LeftCluster
      {...leftCluster.props}
      baseToolButtonClass={baseToolButtonClass}
    />
  ) : null;

/**
 * 背景：
 *  - 工具栏子节点由 Layout Hook 计算，需在 renderRoot 中组合渲染。
 * 目的：
 *  - 提供独立的展示函数来构建 Children，方便未来扩展自定义插槽。
 * 关键决策与取舍：
 *  - 采用纯函数返回 Fragment，既可保持轻量，也便于测试时直接调用校验组合。
 */
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
    <VersionDial {...layout.versionDialProps} />
  </>
);

/**
 * 背景：
 *  - DictionaryActionPanel 需要将工具栏的子节点直接托管给上层 SearchBox，
 *    避免额外的 div 破坏语义与布局节奏。
 * 目的：
 *  - 通过策略函数暴露根节点渲染方式，让调用方可自定义容器或选择“无容器”。
 * 关键决策与取舍：
 *  - 采用简单的 render prop 而非 context，便于在 SSR 与测试场景中保持纯函数特性；
 *  - 默认实现沿用 div 结构，以兼容历史调用方与单测期望。
 * 影响范围：
 *  - 所有 OutputToolbar 调用方，可选择注入 renderRoot 以改变根节点。
 */
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
  versions: [],
  activeVersionId: undefined,
  onNavigate: undefined,
  ttsComponent: TtsButton,
  onCopy: undefined,
  canCopy: false,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canReport: false,
  onReport: undefined,
  className: "",
  role: "toolbar",
  ariaLabel: "词条工具栏",
  renderRoot: defaultRenderRoot,
};

/**
 * 背景：
 *  - defaultProps 在函数组件中愈发边缘化，依赖其填充默认值存在兼容性风险。
 * 目的：
 *  - 在进入布局层前手动回填关键默认项（尤其是 ttsComponent），避免渲染阶段出现 undefined。
 * 关键决策与取舍：
 *  - 仅在值为 undefined 时回落至默认，保留调用方通过 null 显式禁用的能力。
 */
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
  versions: PropTypes.arrayOf(PropTypes.object),
  activeVersionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNavigate: PropTypes.func,
  ttsComponent: PropTypes.elementType,
  onCopy: PropTypes.func,
  canCopy: PropTypes.bool,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
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
