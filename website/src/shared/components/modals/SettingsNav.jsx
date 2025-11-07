import { useMemo } from "react";
import PropTypes from "prop-types";
import { useLanguage } from "@core/context";
import ThemeIcon from "@shared/components/ui/Icon/index.tsx";
import { useMediaQuery } from "@shared/hooks";


const HORIZONTAL_NAV_BREAKPOINT = 768;
const HORIZONTAL_NAV_QUERY = `(max-width: ${HORIZONTAL_NAV_BREAKPOINT}px)`;

/**
 * 意图：针对英文环境生成 Title Case 文案，保证标签语气与设计规范一致。
 * 复杂度：O(n) 取决于词条长度；空间：O(1)。
 */
const formatSectionLabel = (label, locale) => {
  if (typeof label !== "string") {
    return label;
  }
  if (locale !== "en") {
    return label;
  }
  return label
    .split(/(\s+)/)
    .map((segment) => {
      if (!segment.trim()) {
        return segment;
      }
      const characters = Array.from(segment);
      const [first, ...rest] = characters;
      if (!first) {
        return segment;
      }
      return (
        first.toLocaleUpperCase("en-US") +
        rest.join("").toLocaleLowerCase("en-US")
      );
    })
    .join("");
};

const resolveSectionIconNode = (
  iconDescriptor,
  { wrapperClassName, labelText },
) => {
  if (!iconDescriptor || typeof iconDescriptor.name !== "string") {
    return null;
  }

  const width = iconDescriptor.width ?? 20;
  const height = iconDescriptor.height ?? 20;
  const decorative = iconDescriptor.decorative !== false;
  const roleClass = iconDescriptor.roleClass ?? "inherit";
  const title = iconDescriptor.title;
  const altText = decorative ? "" : (iconDescriptor.alt ?? `${labelText} icon`);

  return (
    <span
      aria-hidden={decorative || undefined}
      className={wrapperClassName}
      data-section-icon={iconDescriptor.name}
      key={iconDescriptor.name}
    >
      <ThemeIcon
        name={iconDescriptor.name}
        width={width}
        height={height}
        decorative={decorative}
        roleClass={roleClass}
        alt={altText}
        title={title}
        className={iconDescriptor.className}
        style={iconDescriptor.style}
      />
    </span>
  );
};

function SettingsNav({
  sections,
  activeSectionId,
  onSelect,
  tablistLabel,
  renderCloseAction,
  classes,
}) {
  const { lang } = useLanguage();
  const sectionCount = sections.length;
  const isHorizontalLayout = useMediaQuery(HORIZONTAL_NAV_QUERY);
  const navOrientation = isHorizontalLayout ? "horizontal" : "vertical";
  const containerClassName = classes?.container ?? "";
  const actionWrapperClassName = classes?.action ?? "";
  const navClassName = classes?.nav ?? "";
  const buttonClassName = classes?.button ?? "";
  const labelClassName = classes?.label ?? "";
  const labelTextClassName = classes?.labelText ?? "";
  const iconClassName = classes?.icon ?? "";
  const actionButtonClassName = classes?.actionButton ?? "";

  const closeActionNode = useMemo(() => {
    if (typeof renderCloseAction !== "function") {
      return null;
    }
    return renderCloseAction({ className: actionButtonClassName });
  }, [actionButtonClassName, renderCloseAction]);

  return (
    <div
      className={containerClassName}
      data-orientation={navOrientation}
      data-compact={isHorizontalLayout || undefined}
    >
      <nav
        aria-label={tablistLabel}
        aria-orientation={navOrientation}
        className={navClassName}
        role="tablist"
        /*
         * 通过 CSS 变量暴露分区数量，便于窄屏布局在不引入额外脚本的情况下
         * 等分标签宽度。相比在组件内写死栅格列数，此做法可随 sections 变化
         * 自动适配未来新增的设置分区。
         */
        style={{
          "--settings-nav-section-count": sectionCount,
        }}
        data-orientation={navOrientation}
      >
        {closeActionNode ? (
          <div role="presentation" className={actionWrapperClassName}>
            {closeActionNode}
          </div>
        ) : null}
        {sections.map((section) => {
          const tabId = `${section.id}-tab`;
          const panelId = `${section.id}-panel`;
          const isActive = section.id === activeSectionId;
          const formattedLabel = formatSectionLabel(section.label, lang);
          
          const hideLabelText =
            isHorizontalLayout && Boolean(section.icon?.name);
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              id={tabId}
              aria-controls={panelId}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              disabled={section.disabled}
              className={buttonClassName}
              data-state={isActive ? "active" : "inactive"}
              aria-label={hideLabelText ? formattedLabel : undefined}
              onClick={() => {
                if (!section.disabled) {
                  onSelect(section);
                }
              }}
            >
              {/*
               * 偏好设置导航仅展示主标签文本，避免双列信息导致键盘导航朗读冗余。
               * 如需补充副标题，应改由 tab 内容区域呈现而非按钮内部。
               */}
              <span className={labelClassName}>
                {resolveSectionIconNode(section.icon, {
                  wrapperClassName: iconClassName,
                  labelText: formattedLabel,
                })}
                <span
                  className={labelTextClassName}
                  data-element="label-text"
                  aria-hidden={hideLabelText || undefined}
                >
                  {formattedLabel}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

SettingsNav.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      icon: PropTypes.shape({
        name: PropTypes.string.isRequired,
        width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        decorative: PropTypes.bool,
        roleClass: PropTypes.string,
        alt: PropTypes.string,
        title: PropTypes.string,
        className: PropTypes.string,
        style: PropTypes.object,
      }),
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  classes: PropTypes.shape({
    container: PropTypes.string,
    action: PropTypes.string,
    nav: PropTypes.string,
    button: PropTypes.string,
    label: PropTypes.string,
    labelText: PropTypes.string,
    icon: PropTypes.string,
    actionButton: PropTypes.string,
  }),
};

SettingsNav.defaultProps = {
  activeSectionId: "",
  renderCloseAction: undefined,
  classes: undefined,
};

export default SettingsNav;
