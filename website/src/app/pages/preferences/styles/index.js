/**
 * 背景：
 *  - 原 src/app/pages/preferences/Preferences.module.css 长期堆叠至超出行数上限，难以定位职责。
 * 目的：
 *  - 以门面（Facade）模式聚合拆分后的 CSS Modules，对调用方保持稳定接口。
 * 关键决策与取舍：
 *  - 通过 createStyleFacade 构建冻结代理，兼容真实样式与 Jest 代理；
 *  - 与直接更新所有调用方相比，集中聚合减少改动面。
 * 影响范围：
 *  - Preferences 页面与 SettingsModal。
 * 演进与TODO：
 *  - TODO: 后续可引入更细粒度的主题/尺寸策略映射。
 */

import createStyleFacade from "@shared/styles/createStyleFacade.js";
import ContentStyles from "./content.module.css";
import TabSummaryStyles from "./tab-summary.module.css";
import ControlFieldStyles from "./control-field.module.css";
import FieldControlStyles from "./field-control.module.css";
import SubscriptionPlanGridStyles from "./subscription-plan-grid.module.css";
import SubscriptionTableStyles from "./subscription-table.module.css";
import AvatarInputStyles from "./avatar-input.module.css";
import BindingActionStyles from "./binding-action.module.css";

const styles = createStyleFacade([
  ContentStyles,
  TabSummaryStyles,
  ControlFieldStyles,
  FieldControlStyles,
  SubscriptionPlanGridStyles,
  SubscriptionTableStyles,
  AvatarInputStyles,
  BindingActionStyles,
]);

export default styles;
