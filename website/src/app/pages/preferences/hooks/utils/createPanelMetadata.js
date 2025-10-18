/**
 * 背景：
 *  - 偏好设置面板的无障碍标识生成曾散落在 usePreferenceSections 中，维护困难。
 * 目的：
 *  - 提供单一职责的工具方法，产出 panel/tab/heading 等标识符与模态标题。
 * 关键决策与取舍：
 *  - 通过分解子函数降低圈复杂度，满足 ESLint 的 max-complexity 要求；
 *  - 沿用 FALLBACK_MODAL_HEADING_ID 保障键盘聚焦路径不变。
 * 影响范围：
 *  - 偏好设置页面及所有复用该工具的模态或子入口。
 * 演进与TODO：
 *  - 后续可在此加入实验性文案格式化（例如国际化日期）。
 */
import { FALLBACK_MODAL_HEADING_ID } from "../constants.js";
import { pickFirstMeaningfulString } from "./displayValues.js";

const buildSectionAnchor = (activeSection, suffix) =>
  activeSection ? `${activeSection.id}-${suffix}` : "";

const hasMeaningfulDescription = (activeSection) => {
  if (!activeSection) {
    return false;
  }

  const { message } = activeSection.componentProps ?? {};
  if (typeof message !== "string") {
    return false;
  }

  return message.trim().length > 0;
};

export const createPanelMetadata = ({ activeSection, modalTitle }) => {
  const panelId = buildSectionAnchor(activeSection, "panel");
  const tabId = buildSectionAnchor(activeSection, "tab");
  const headingId = buildSectionAnchor(activeSection, "section-heading");
  const descriptionId = hasMeaningfulDescription(activeSection)
    ? buildSectionAnchor(activeSection, "section-description")
    : undefined;
  const modalHeadingText = pickFirstMeaningfulString(
    [activeSection?.componentProps?.title, activeSection?.label],
    modalTitle,
  );
  const focusHeadingId = headingId || FALLBACK_MODAL_HEADING_ID;

  return {
    panelId,
    tabId,
    headingId,
    descriptionId,
    focusHeadingId,
    modalHeadingId: FALLBACK_MODAL_HEADING_ID,
    modalHeadingText,
  };
};
