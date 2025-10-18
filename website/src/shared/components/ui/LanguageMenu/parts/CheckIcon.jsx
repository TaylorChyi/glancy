/**
 * 背景：
 *  - 原有的复选图标定义内联在 LanguageMenu 主文件中，增大行数并使复用困难。
 * 目的：
 *  - 独立封装语义化的图标组件，确保主组件聚焦状态管理，同时允许其他菜单共享。
 * 关键决策与取舍：
 *  - 保持纯展示组件，无副作用，默认导出具名函数，遵循共享组件规范；
 *  - 拒绝引入额外图标库以避免体积回退，沿用现有 SVG 定义。
 * 影响范围：
 *  - LanguageMenu 与未来可能引用该图标的其他 UI 组件。
 * 演进与TODO：
 *  - TODO: 若图标体系升级，可在此接入统一 Icon Registry 再由调用方注入。
 */
import PropTypes from "prop-types";

export default function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="m4 8.25 2.25 2.25L12 4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

CheckIcon.propTypes = {
  className: PropTypes.string,
};

CheckIcon.defaultProps = {
  className: undefined,
};
