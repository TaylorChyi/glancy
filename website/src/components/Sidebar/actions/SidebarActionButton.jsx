/**
 * 背景：
 *  - 导航按钮此前直接在 Sidebar 中渲染，后续新增按钮或调整布局需要反复复制模板。
 * 目的：
 *  - 将按钮渲染与语义属性封装成展示组件，容器仅传入数据即可复用。
 * 关键决策与取舍：
 *  - 组件仅负责展示与交互事件绑定，不持有状态，符合“奢侈品级极简”视觉要求；
 *    若继续在容器中内联按钮结构，后续扩展会导致重复样板代码，故舍弃。
 * 影响范围：
 *  - SidebarNavigation 通过该组件输出按钮列表，保持既有样式 token。
 * 演进与TODO：
 *  - 如需支持悬停提示或快捷键展示，可在 props 中扩展描述字段。
 */
import PropTypes from "prop-types";
import ThemeIcon from "@/components/ui/Icon";
import styles from "../Sidebar.module.css";

function SidebarActionButton({ icon, label, active, onClick, testId }) {
  return (
    <button
      type="button"
      className={styles["app-button"]}
      data-active={active}
      aria-pressed={active}
      onClick={onClick}
      title={typeof label === "string" ? label : undefined}
      data-testid={testId}
    >
      <ThemeIcon
        name={icon}
        alt={typeof label === "string" ? label : undefined}
        width={18}
        height={18}
      />
    </button>
  );
}

SidebarActionButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  testId: PropTypes.string,
};

SidebarActionButton.defaultProps = {
  active: false,
  onClick: undefined,
  testId: undefined,
};

export default SidebarActionButton;
