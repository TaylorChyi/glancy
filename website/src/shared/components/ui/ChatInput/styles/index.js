/**
 * 背景：
 *  - 原 src/shared/components/ui/ChatInput/ChatInput.module.css 长期堆叠至超出行数上限，难以定位职责。
 * 目的：
 *  - 以门面（Facade）模式聚合拆分后的 CSS Modules，对调用方保持稳定接口。
 * 关键决策与取舍：
 *  - 通过 createStyleFacade 构建冻结代理，兼容真实样式与 Jest 代理；
 *  - 与直接更新所有调用方相比，集中聚合减少改动面。
 * 影响范围：
 *  - 对话输入组件。
 * 演进与TODO：
 *  - TODO: 后续可引入更细粒度的主题/尺寸策略映射。
 */

import createStyleFacade from "@shared/styles/createStyleFacade.js";
import ContainerStyles from "./container.module.css";
import LanguageArrowStyles from "./language-arrow.module.css";

const styles = createStyleFacade([
  ContainerStyles,
  LanguageArrowStyles,
]);

export default styles;
