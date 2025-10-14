/**
 * 背景：
 *  - 偏好设置页面与模态的各个分区组件长期内复制相同的 section 语义与布局结构，
 *    导致标题、分隔线与描述的可访问性逻辑无法集中治理。
 * 目的：
 *  - 以模板方法（Template Method）模式收敛分区骨架，统一 aria 语义与视觉结构，
 *    同时暴露最小必要的插槽让具体分区专注于内容渲染。
 * 关键决策与取舍：
 *  - 选择通过组合式组件提供骨架，而非 mixin/高阶组件，避免 React 生态中不必要的层级嵌套；
 *  - 允许自定义 className 以复用既有 CSS Module，避免跨目录样式耦合。
 * 影响范围：
 *  - 偏好设置下所有 section 组件的 DOM 结构与 aria 关联方式。
 * 演进与TODO：
 *  - TODO: 如需支持动态插入附加头部动作，可在 renderHeader 回调中开放扩展点。
 */
import { useId, useMemo } from "react";
import PropTypes from "prop-types";

const sanitizeId = (id) => id?.replaceAll(":", "-");

const isRenderable = (value) => value !== null && value !== undefined && value !== "";

function SettingsSection({
  headingId,
  title,
  description,
  descriptionId,
  describedBy,
  showDivider = true,
  classes = {},
  children,
  ...sectionProps
}) {
  const autoDescriptionId = useId();
  const shouldRenderDescription = isRenderable(description);

  const resolvedDescriptionId = useMemo(() => {
    if (!shouldRenderDescription) {
      return undefined;
    }
    const candidateId = descriptionId ?? `${headingId}-${sanitizeId(autoDescriptionId)}`;
    return sanitizeId(candidateId);
  }, [autoDescriptionId, descriptionId, headingId, shouldRenderDescription]);

  const { section: sectionClassName, header: headerClassName, title: titleClassName, divider: dividerClassName, description: descriptionClassName } = classes;

  const { "aria-describedby": ariaDescribedByFromProps, ...restSectionProps } = sectionProps;
  const ariaDescribedBy = describedBy ?? ariaDescribedByFromProps ?? (shouldRenderDescription ? resolvedDescriptionId : undefined);

  return (
    <section
      aria-labelledby={headingId}
      {...restSectionProps}
      className={sectionClassName}
      aria-describedby={ariaDescribedBy}
    >
      <div className={headerClassName}>
        <h3 id={headingId} className={titleClassName} tabIndex={-1}>
          {title}
        </h3>
        {showDivider ? (
          <div className={dividerClassName} aria-hidden="true" />
        ) : null}
      </div>
      {shouldRenderDescription ? (
        <p id={resolvedDescriptionId} className={descriptionClassName}>
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

SettingsSection.propTypes = {
  headingId: PropTypes.string.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  descriptionId: PropTypes.string,
  describedBy: PropTypes.string,
  showDivider: PropTypes.bool,
  classes: PropTypes.shape({
    section: PropTypes.string,
    header: PropTypes.string,
    title: PropTypes.string,
    divider: PropTypes.string,
    description: PropTypes.string,
  }),
  children: PropTypes.node.isRequired,
};

export default SettingsSection;
