/**
 * 背景：
 *  - 原 HistoryList 组件同时承担数据请求、错误提示与渲染，难以复用且测试压力大。
 * 目的：
 *  - 将其重构为纯展示组件，仅负责渲染列表与绑定交互回调，逻辑由容器/Hook 提供。
 * 关键决策与取舍：
 *  - 采用“容器 + 展示”分层：展示层只消费 `items`、`onSelect`、`onNavigate`，避免直接依赖上下文；
 *    若继续在组件内访问上下文，将破坏自定义 Hook 的聚合能力。
 * 影响范围：
 *  - 所有引用方需通过容器层传递数据与回调，CSS 模块保持不变，DOM 结构保持 listbox 语义。
 * 演进与TODO：
 *  - 若未来需支持分组或虚拟滚动，可在容器层扩展数据结构并在此组件中追加渲染分支。
 */
import PropTypes from "prop-types";
import NavItem from "./NavItem.jsx";
import styles from "./HistoryList.module.css";

function HistoryListView({ items, onSelect, onNavigate }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <ul className={styles.list} role="listbox">
      {items.map((item, index) => {
        const navigationBindings = onNavigate(index) || {};

        return (
          <li key={item.termKey} className={styles.item} role="presentation">
            <NavItem
              label={item.term}
              onClick={() => {
                if (typeof onSelect === "function") {
                  onSelect(item);
                }
              }}
              className={styles.entryButton}
              /*
               * 背景：历史项已在 store 层归一化词形，这里直接透出 term 以保持与查询结果对齐。
               * 取舍：保留 NavItem 的多行模式，让较长词条在侧栏仍可完整展示。
               */
              allowMultilineLabel
              ref={navigationBindings.ref}
              onKeyDown={navigationBindings.onKeyDown}
            />
          </li>
        );
      })}
    </ul>
  );
}

HistoryListView.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      termKey: PropTypes.string.isRequired,
      term: PropTypes.string.isRequired,
      latestVersionId: PropTypes.string,
    }),
  ),
  onSelect: PropTypes.func,
  onNavigate: PropTypes.func,
};

HistoryListView.defaultProps = {
  items: [],
  onSelect: undefined,
  onNavigate: () => ({}),
};

export default HistoryListView;
