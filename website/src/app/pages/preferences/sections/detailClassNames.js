/**
 * 背景：
 *  - 偏好设置账号分区内多处需要组合 UsernameEditor 与局部 detail 样式，历史上在各组件内重复拼接 className。
 * 目的：
 *  - 将 detail 区域的输入与动作按钮的 className 生成集中管理，确保未来样式调整时只需修改单点。
 * 关键决策与取舍：
 *  - 采用常量导出而非函数，以避免在渲染期间重复执行拼接；如后续需要根据主题动态生成，可演进为工厂函数。
 * 影响范围：
 *  - AccountSection 下游的字段行组件；共享模块保持无感知。
 * 演进与TODO：
 *  - 若后续引入主题切换，可提供基于 token 的派生函数。
 */
import usernameEditorStyles from "@shared/components/Profile/UsernameEditor/UsernameEditor.module.css";
import styles from "../styles/index.js";

export const DETAIL_INPUT_CLASSNAME = [
  usernameEditorStyles.input,
  styles["detail-input"],
]
  .filter(Boolean)
  .join(" ");

export const DETAIL_ACTION_BUTTON_CLASSNAME = [
  styles["avatar-trigger"],
  styles["detail-action-button"],
]
  .filter(Boolean)
  .join(" ");
