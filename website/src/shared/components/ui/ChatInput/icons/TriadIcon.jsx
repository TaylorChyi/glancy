/**
 * 背景：
 *  - 语言控制入口改用三点三角图标，避免宽幅触发器挤占输入区空间。
 * 目的：
 *  - 提供纯展示的 SVG 图标组件，供语言菜单触发按钮复用。
 * 关键决策与取舍：
 *  - 采用静态 SVG，避免运行时绘制开销；
 *  - 暴露 data-icon-name 便于测试校验与后续主题化扩展。
 * 影响范围：
 *  - ChatInput 语言控件触发按钮的新视觉基线。
 * 演进与TODO：
 *  - 若未来需要可配置尺寸，可在 props 中扩展 size/token 支持。
 */
import PropTypes from "prop-types";

function TriadIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
      data-icon-name="language-triad"
    >
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
    </svg>
  );
}

TriadIcon.propTypes = {
  className: PropTypes.string,
};

TriadIcon.defaultProps = {
  className: undefined,
};

export default TriadIcon;
