/**
 * 背景：
 *  - ICP 备案信息需在底部 docker 呈现，但常驻会压缩输入区域且缺乏交互节奏。
 * 目的：
 *  - 通过“初始展示 + 悬停触发暂显”策略保留合规信息，同时释放主操作空间。
 * 关键决策与取舍：
 *  - 采用容器组件 + 展示组件组合，逻辑通过 Hook 管理，确保 ICP.jsx 保持纯展示属性；
 *  - 引入 1px 触发带与上下滑动动画，兼顾交互可达与视觉克制。
 * 影响范围：
 *  - 仅影响在 docker 内使用的 ICP 呈现方式，其它直接引用 ICP 的界面不受影响。
 * 演进与TODO：
 *  - 可根据实际数据调整显隐时长或接入全局可访问性提示，保障特殊用户操作路径。
 */
import ICP from "./ICP.jsx";
import useDockedICPVisibility from "./useDockedICPVisibility.js";
import styles from "./DockedICP.module.css";

function DockedICP() {
  const { isVisible, reveal } = useDockedICPVisibility();
  const containerState = isVisible ? "visible" : "hidden";

  return (
    <div className={styles.host}>
      <div
        className={styles.container}
        data-testid="icp-docked-container"
        data-state={containerState}
        aria-hidden={!isVisible}
      >
        <div className={styles.panel} data-state={containerState}>
          <ICP />
        </div>
      </div>
      <div
        className={styles["reveal-handle"]}
        data-testid="icp-reveal-handle"
        aria-hidden="true"
        onPointerEnter={reveal}
        onMouseEnter={reveal}
      />
    </div>
  );
}

export default DockedICP;
