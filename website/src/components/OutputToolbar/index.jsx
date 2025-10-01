import PropTypes from "prop-types";
import { memo, useMemo } from "react";
import { TtsButton } from "@/components";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage, useUser } from "@/context";
import styles from "./OutputToolbar.module.css";

const ACTION_BLUEPRINTS = [
  {
    key: "favorite",
    variant: "favorite",
    requiresUser: true,
    getLabel: ({ t, favorited }) =>
      favorited
        ? t.favoriteRemove || t.favoriteAction || "Favorite"
        : t.favoriteAction || "Favorite",
    getIcon: ({ favorited }) =>
      favorited ? (
        <ThemeIcon name="star-solid" width={22} height={22} />
      ) : (
        <ThemeIcon name="star-outline" width={22} height={22} />
      ),
    isActive: ({ favorited }) => Boolean(favorited),
    canUse: ({ canFavorite }) => Boolean(canFavorite),
    getHandler: ({ onToggleFavorite }) => onToggleFavorite,
  },
  {
    key: "delete",
    variant: "delete",
    requiresUser: true,
    getLabel: ({ t }) => t.deleteButton || t.deleteAction || "Delete",
    getIcon: () => <ThemeIcon name="trash" width={20} height={20} />,
    canUse: ({ canDelete }) => Boolean(canDelete),
    getHandler: ({ onDelete }) => onDelete,
  },
  {
    key: "share",
    variant: "share",
    requiresUser: true,
    getLabel: ({ t }) => t.share || "Share",
    getIcon: () => <ThemeIcon name="link" width={20} height={20} />,
    canUse: ({ canShare }) => Boolean(canShare),
    getHandler: ({ onShare }) => onShare,
  },
  {
    key: "report",
    variant: "report",
    requiresUser: true,
    hiddenWhenInactive: true,
    getLabel: ({ t }) => t.report || "Report",
    getIcon: () => <ThemeIcon name="flag" width={20} height={20} />,
    canUse: ({ canReport }) => Boolean(canReport),
    getHandler: ({ onReport }) => onReport,
  },
];

/**
 * 背景：
 *  - DictionaryActionPanel 需要将工具栏的子节点直接托管给上层 SearchBox，
 *    避免额外的 div 破坏语义与布局节奏。
 * 目的：
 *  - 通过策略函数暴露根节点渲染方式，让调用方可自定义容器或选择“无容器”。
 * 关键决策与取舍：
 *  - 采用简单的 render prop 而非 context，便于在 SSR 与测试场景中保持纯函数特性；
 *  - 默认实现沿用 div 结构，以兼容历史调用方与单测期望。
 * 影响范围：
 *  - 所有 OutputToolbar 调用方，可选择注入 renderRoot 以改变根节点。
 */
const defaultRenderRoot = ({
  className,
  role,
  ariaLabel,
  dataTestId,
  children,
}) => (
  <div
    className={className}
    role={role}
    aria-label={ariaLabel}
    data-testid={dataTestId}
  >
    {children}
  </div>
);

function OutputToolbar({
  term,
  lang,
  onReoutput,
  disabled,
  versions,
  activeVersionId,
  onNavigate,
  ttsComponent = TtsButton,
  onCopy,
  canCopy = false,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
  canShare = false,
  onShare,
  canReport = false,
  onReport,
  className,
  role: toolbarRole = "toolbar",
  ariaLabel = "词条工具栏",
  renderRoot = defaultRenderRoot,
}) {
  const { t } = useLanguage();
  const { user } = useUser();
  const TtsComponent = ttsComponent;
  const { currentIndex, total } = useMemo(() => {
    if (!Array.isArray(versions) || versions.length === 0) {
      return { currentIndex: 0, total: 0 };
    }
    const resolvedIndex = versions.findIndex(
      (item) => String(item.id) === String(activeVersionId),
    );
    const index = resolvedIndex >= 0 ? resolvedIndex + 1 : versions.length;
    return { currentIndex: index, total: versions.length };
  }, [versions, activeVersionId]);

  const hasPrevious = total > 1 && currentIndex > 1;
  const hasNext = total > 1 && currentIndex < total;
  const indicator = total
    ? (t.versionIndicator || "{current} / {total}")
        .replace("{current}", String(currentIndex))
        .replace("{total}", String(total))
    : t.versionIndicatorEmpty || "0 / 0";
  const speakableTerm = typeof term === "string" ? term.trim() : term;
  const showTts = Boolean(speakableTerm);
  const copyLabel = t.copyAction || "Copy";
  const actionContext = useMemo(
    () => ({
      t,
      user,
      favorited,
      canFavorite,
      onToggleFavorite,
      canDelete,
      onDelete,
      canShare,
      onShare,
      canReport,
      onReport,
      disabled,
    }),
    [
      t,
      user,
      favorited,
      canFavorite,
      onToggleFavorite,
      canDelete,
      onDelete,
      canShare,
      onShare,
      canReport,
      onReport,
      disabled,
    ],
  );

  const actionItems = useMemo(() => {
    const items = [
      {
        key: "copy",
        label: copyLabel,
        icon: <ThemeIcon name="copy" width={20} height={20} />,
        onClick: onCopy,
        active: false,
        variant: "copy",
        disabled: disabled || !canCopy || typeof onCopy !== "function",
      },
    ];

    ACTION_BLUEPRINTS.forEach((blueprint) => {
      const handler = blueprint.getHandler?.(actionContext);
      const label = blueprint.getLabel(actionContext);
      const canUseAction = blueprint.canUse?.(actionContext) ?? true;
      const hasUser = !blueprint.requiresUser || Boolean(user);
      const isHandlerFunction = typeof handler === "function";
      const itemDisabled =
        disabled || !hasUser || !canUseAction || !isHandlerFunction;

      if (blueprint.hiddenWhenInactive && itemDisabled) {
        return;
      }

      items.push({
        key: blueprint.key,
        label,
        icon: blueprint.getIcon(actionContext),
        onClick: handler,
        active: blueprint.isActive?.(actionContext) ?? false,
        variant: blueprint.variant,
        disabled: itemDisabled,
      });
    });

    return items;
  }, [actionContext, canCopy, copyLabel, disabled, onCopy, user]);

  const showReplay = typeof onReoutput === "function";
  const showLeftCluster = showTts || showReplay;
  const hasActions = actionItems.length > 0;
  const rootClassName = Array.from(
    new Set([styles.toolbar, "entry__toolbar", className].filter(Boolean)),
  ).join(" ");
  const rootProps = useMemo(
    () => ({
      className: rootClassName,
      role: toolbarRole,
      ariaLabel,
      dataTestId: "output-toolbar",
    }),
    [ariaLabel, rootClassName, toolbarRole],
  );
  const pagerLabel = t.versionGroupLabel || "例句翻页";
  const baseToolButtonClass = [styles["tool-button"], "entry__tool-btn"]
    .filter(Boolean)
    .join(" ");

  const toolbarContent = (
    <>
      {showLeftCluster ? (
        <div className={styles["left-cluster"]}>
          {showTts ? (
            <TtsComponent
              text={term}
              lang={lang}
              size={20}
              disabled={!speakableTerm}
            />
          ) : null}
          {showReplay ? (
            <button
              type="button"
              className={`${baseToolButtonClass} ${styles["tool-button-replay"]}`}
              onClick={onReoutput}
              disabled={disabled || !speakableTerm}
              aria-label={t.reoutput}
            >
              <ThemeIcon
                name="refresh"
                width={16}
                height={16}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      ) : null}
      {hasActions ? (
        <div className={styles["action-strip"]}>
          {actionItems.map(
            ({
              key,
              label,
              onClick,
              icon,
              active,
              variant,
              disabled: itemDisabled,
            }) => {
              const variantClassName =
                variant && styles[`tool-button-${variant}`]
                  ? styles[`tool-button-${variant}`]
                  : "";
              const buttonClassName = [baseToolButtonClass, variantClassName]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={key}
                  type="button"
                  className={buttonClassName}
                  data-active={active ? "true" : undefined}
                  onClick={onClick}
                  aria-label={label}
                  title={label}
                  disabled={itemDisabled}
                >
                  {icon}
                </button>
              );
            },
          )}
        </div>
      ) : null}
      <div
        className={`${styles["version-dial"]} entry__pager`}
        role="group"
        aria-label={pagerLabel}
      >
        <button
          type="button"
          className={`${styles["nav-button"]} entry__tool-btn`}
          onClick={() => onNavigate?.("previous")}
          disabled={!hasPrevious || disabled}
          aria-label={t.previousVersion}
        >
          <ThemeIcon
            name="arrow-left"
            width={14}
            height={14}
            aria-hidden="true"
          />
        </button>
        <span
          className={styles.indicator}
          aria-live="polite"
          aria-atomic="true"
        >
          {indicator}
        </span>
        <button
          type="button"
          className={`${styles["nav-button"]} entry__tool-btn`}
          onClick={() => onNavigate?.("next")}
          disabled={!hasNext || disabled}
          aria-label={t.nextVersion}
        >
          <ThemeIcon
            name="arrow-right"
            width={14}
            height={14}
            aria-hidden="true"
          />
        </button>
      </div>
    </>
  );

  return renderRoot({ ...rootProps, children: toolbarContent });
}

OutputToolbar.propTypes = {
  term: PropTypes.string,
  lang: PropTypes.string,
  onReoutput: PropTypes.func,
  disabled: PropTypes.bool,
  versions: PropTypes.arrayOf(PropTypes.object),
  activeVersionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onNavigate: PropTypes.func,
  ttsComponent: PropTypes.elementType,
  onCopy: PropTypes.func,
  canCopy: PropTypes.bool,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canShare: PropTypes.bool,
  onShare: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
  className: PropTypes.string,
  role: PropTypes.string,
  ariaLabel: PropTypes.string,
  renderRoot: PropTypes.func,
};

OutputToolbar.defaultProps = {
  term: "",
  lang: "en",
  onReoutput: undefined,
  disabled: false,
  versions: [],
  activeVersionId: undefined,
  onNavigate: undefined,
  ttsComponent: TtsButton,
  onCopy: undefined,
  canCopy: false,
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canShare: false,
  onShare: undefined,
  canReport: false,
  onReport: undefined,
  className: "",
  role: "toolbar",
  ariaLabel: "词条工具栏",
  renderRoot: defaultRenderRoot,
};

export default memo(OutputToolbar);
