/**
 * 背景：
 *  - AccountSection 直接内嵌绑定列表渲染，导致主组件行数过高且边界不清。
 * 目的：
 *  - 提供可选的绑定列表展示组件，保持主组件聚焦在装配职责。
 * 关键决策与取舍：
 *  - 将无绑定场景下的 null 返回逻辑收敛到组件内部，避免父组件重复判空；
 *  - 渲染结构保持不变，确保无样式回归。
 * 影响范围：
 *  - 偏好设置页面的账号绑定区域。
 * 演进与TODO：
 *  - 后续可在此增加 action handler 或分离为列表项子组件。
 */
import PropTypes from "prop-types";

import styles from "../styles/index.js";

/**
 * 意图：渲染第三方账号绑定信息列表。
 * 输入：bindings —— 包含标题与条目集合的描述对象。
 * 输出：绑定列表节点或 null。
 * 流程：
 *  1) 无 bindings 时直接返回 null；
 *  2) 渲染标题与条目列表，保持按钮禁用态。
 * 错误处理：纯展示逻辑无需特殊处理。
 * 复杂度：O(n)。
 */
function AccountBindings({ bindings }) {
  if (!bindings) {
    return null;
  }

  return (
    <div className={styles.bindings} aria-live="polite">
      <h4 className={styles["bindings-title"]}>{bindings.title}</h4>
      <ul className={styles["bindings-list"]}>
        {bindings.items.map((binding) => (
          <li key={binding.id} className={styles["binding-item"]}>
            <div className={styles["binding-copy"]}>
              <span className={styles["binding-name"]}>{binding.name}</span>
              <span className={styles["binding-status"]}>{binding.status}</span>
            </div>
            <button
              type="button"
              className={styles["binding-action"]}
              aria-disabled="true"
              disabled
            >
              {binding.actionLabel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

AccountBindings.propTypes = {
  bindings: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        actionLabel: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }),
};

AccountBindings.defaultProps = {
  bindings: null,
};

export default AccountBindings;
