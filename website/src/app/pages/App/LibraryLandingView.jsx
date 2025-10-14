/**
 * 背景：
 *  - 收藏入口切换为“致用单词”图书馆概念后，需要保留导航占位并避免旧收藏列表的复杂交互。
 * 目的：
 *  - 提供极简的占位视图，使主内容区以品牌化标签居中呈现，等待后续能力扩展。
 * 关键决策与取舍：
 *  - 使用局部 CSS Module 控制排版，以 flex 居中保证在不同视口下保持视觉平衡；
 *    相比保留旧列表样式，可显著减轻无数据时的视觉噪音。
 * 影响范围：
 *  - 词典体验在“致用单词”视图下渲染该占位组件，替换原有 FavoritesView。
 * 演进与TODO：
 *  - 后续可在此组件内扩展动态推荐或快捷入口，不影响当前容器契约。
 */
import { memo } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryLandingView.module.css";

function LibraryLandingView({ label }) {
  return (
    <section className={styles.root} aria-labelledby="library-landing-label">
      <span id="library-landing-label" className={styles.label}>
        {label}
      </span>
    </section>
  );
}

LibraryLandingView.propTypes = {
  label: PropTypes.string,
};

LibraryLandingView.defaultProps = {
  label: "致用单词",
};

export default memo(LibraryLandingView);
