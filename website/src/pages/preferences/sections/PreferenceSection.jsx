/**
 * 背景：
 *  - 偏好设置的每个分区原本各自维护标题、分割线与 aria 语义，导致结构重复且难以统一演进。
 * 目的：
 *  - 以模板方法模式抽象出通用分区容器，统一标题/描述/Divider 的排布并暴露插槽供具体分区填充内容。
 * 关键决策与取舍：
 *  - 采用轻量 joinClassName + 可配置 variant，保证现有 CSS Module 能被复用且无需引入第三方工具；
 *  - renderDescription 回调提供扩展点，兼容普通文本与视觉隐藏提示，避免在组件内硬编码语义策略。
 * 影响范围：
 *  - Preferences 页面及 SettingsModal 下所有分区组件；未来新增分区时可直接复用容器保持一致体验。
 * 演进与TODO：
 *  - TODO: 如后续引入分区级操作栏或辅助说明，可通过 headerAddon/description 扩展点增强模板。
 */
import { cloneElement, isValidElement, useId } from "react";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

export const PREFERENCE_SECTION_VARIANTS = Object.freeze({
  DEFAULT: "default",
  PLAIN: "plain",
});

const variantClassName = {
  [PREFERENCE_SECTION_VARIANTS.DEFAULT]: "",
  [PREFERENCE_SECTION_VARIANTS.PLAIN]: styles["section-plain"],
};

const joinClassName = (...tokens) => tokens.filter(Boolean).join(" ");

function PreferenceSection({
  title,
  headingId,
  children,
  variant = PREFERENCE_SECTION_VARIANTS.PLAIN,
  className = "",
  description,
  renderDescription,
  descriptionId,
  describedBy,
  divider = true,
  headerAddon = null,
  headingTabIndex = -1,
  as: SectionComponent = "section",
  ...rest
}) {
  const autoDescriptionId = useId();
  const fallbackDescriptionId = descriptionId ?? autoDescriptionId;

  const resolvedDescriptionNode = (() => {
    if (typeof renderDescription === "function") {
      return renderDescription({
        id: fallbackDescriptionId,
        className: styles["section-description"],
        description,
      });
    }
    if (typeof description === "string") {
      return (
        <p id={fallbackDescriptionId} className={styles["section-description"]}>
          {description}
        </p>
      );
    }
    if (isValidElement(description)) {
      return cloneElement(description, {
        id: description.props?.id ?? fallbackDescriptionId,
      });
    }
    return null;
  })();

  const resolvedDescriptionId =
    describedBy ?? (resolvedDescriptionNode ? fallbackDescriptionId : undefined);

  const composedSectionClassName = joinClassName(
    styles.section,
    variantClassName[variant],
    className,
  );

  return (
    <SectionComponent
      {...rest}
      aria-labelledby={headingId}
      aria-describedby={resolvedDescriptionId}
      className={composedSectionClassName}
    >
      <div className={styles["section-header"]}>
        <h3
          id={headingId}
          className={styles["section-title"]}
          tabIndex={headingTabIndex}
        >
          {title}
        </h3>
        {divider ? (
          <div className={styles["section-divider"]} aria-hidden="true" />
        ) : null}
        {headerAddon}
      </div>
      {resolvedDescriptionNode}
      {children}
    </SectionComponent>
  );
}

PreferenceSection.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(Object.values(PREFERENCE_SECTION_VARIANTS)),
  className: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  renderDescription: PropTypes.func,
  descriptionId: PropTypes.string,
  describedBy: PropTypes.string,
  divider: PropTypes.bool,
  headerAddon: PropTypes.node,
  headingTabIndex: PropTypes.number,
  as: PropTypes.elementType,
};

export default PreferenceSection;
