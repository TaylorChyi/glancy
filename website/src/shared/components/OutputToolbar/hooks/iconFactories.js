/**
 * 背景：
 *  - 动作蓝图与工厂在多个模块中需要复用 ThemeIcon 的构造逻辑。
 * 目的：
 *  - 通过简单工厂统一封装图标创建，避免 JSX 分散导致的构建失败与维护成本提升。
 * 关键决策与取舍：
 *  - 采用 React.createElement 提供延迟执行的轻量“享元”，减少重复渲染对象构建；
 *  - 导出语义化解析函数（resolveXIcon）以便未来接入特性开关或动态主题策略。
 * 影响范围：
 *  - OutputToolbar 相关动作蓝图与复制按钮；
 *  - 任何引用 ICON_FACTORIES 的新动作均需保证设计令牌一致性。
 * 演进与TODO：
 *  - 可扩展缓存策略以减少高频渲染时的 React element 重新创建。
 */
import { createElement } from "react";

import ThemeIcon from "@shared/components/ui/Icon";

const createThemeIconFactory = (name, size) =>
  () =>
    createElement(ThemeIcon, {
      name,
      width: size,
      height: size,
    });

const COPY_ICON_FACTORY = Object.freeze({
  success: createThemeIconFactory("copy-success", 20),
  default: createThemeIconFactory("copy", 20),
});

const DELETE_ICON_FACTORY = createThemeIconFactory("trash", 20);
const REPORT_ICON_FACTORY = createThemeIconFactory("flag", 20);
export const ICON_FACTORIES = Object.freeze({
  copy: COPY_ICON_FACTORY,
  delete: DELETE_ICON_FACTORY,
  report: REPORT_ICON_FACTORY,
});

export const resolveCopyIcon = (isSuccess) =>
  (isSuccess ? COPY_ICON_FACTORY.success : COPY_ICON_FACTORY.default)();

export const resolveDeleteIcon = () => DELETE_ICON_FACTORY();

export const resolveReportIcon = () => REPORT_ICON_FACTORY();

