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
    getLabel: ({ t }) => t.deleteButton || t.deleteAction || "Delete",
    getIcon: () => <ThemeIcon name="trash" width={20} height={20} />,
    canUse: ({ canDelete }) => Boolean(canDelete),
    getHandler: ({ onDelete }) => onDelete,
  },
  {
    key: "share",
    variant: "share",
    getLabel: ({ t }) => t.share || "Share",
    getIcon: () => <ThemeIcon name="link" width={20} height={20} />,
    canUse: ({ canShare }) => Boolean(canShare),
    getHandler: ({ onShare }) => onShare,
  },
  {
    key: "report",
    variant: "report",
    getLabel: ({ t }) => t.report || "Report",
    getIcon: () => <ThemeIcon name="flag" width={20} height={20} />,
    canUse: ({ canReport }) => Boolean(canReport),
    getHandler: ({ onReport }) => onReport,
  },
];

function OutputToolbar({
  term,
  lang,
  onReoutput,
  disabled,
  versions,
  activeVersionId,
  onNavigate,
  ttsComponent = TtsButton,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
  canShare = false,
  onShare,
  canReport = false,
  onReport,
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
    ],
  );

  const actionItems = useMemo(
    () =>
      ACTION_BLUEPRINTS.map((blueprint) => {
        if (!actionContext.user) {
          return null;
        }

        const handler = blueprint.getHandler?.(actionContext);
        const label = blueprint.getLabel(actionContext);
        const disabled =
          !blueprint.canUse?.(actionContext) || typeof handler !== "function";

        return {
          key: blueprint.key,
          label,
          icon: blueprint.getIcon(actionContext),
          onClick: handler,
          active: blueprint.isActive?.(actionContext) ?? false,
          variant: blueprint.variant,
          disabled,
        };
      }).filter(Boolean),
    [actionContext],
  );

  const hasActions = actionItems.length > 0;

  return (
    <div className={styles.toolbar} data-testid="output-toolbar">
      <div className={styles["cluster-controls"]}>
        {showTts ? (
          <TtsComponent
            text={term}
            lang={lang}
            size={20}
            disabled={!speakableTerm}
          />
        ) : null}
        <button
          type="button"
          className={styles.replay}
          onClick={onReoutput}
          disabled={disabled || !speakableTerm}
          aria-label={t.reoutput}
        >
          <ThemeIcon name="refresh" width={16} height={16} aria-hidden="true" />
          <span>{t.reoutput}</span>
        </button>
        <div className={styles["version-controls"]}>
          <button
            type="button"
            className={styles["nav-button"]}
            onClick={() => onNavigate?.("previous")}
            disabled={!hasPrevious}
            aria-label={t.previousVersion}
          >
            <ThemeIcon
              name="arrow-left"
              width={14}
              height={14}
              aria-hidden="true"
            />
          </button>
          <span className={styles.indicator}>{indicator}</span>
          <button
            type="button"
            className={styles["nav-button"]}
            onClick={() => onNavigate?.("next")}
            disabled={!hasNext}
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
      </div>
      {hasActions ? (
        <div className={styles["cluster-actions"]}>
          <div className={styles["action-group"]}>
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
                  variant && styles[`action-button-${variant}`]
                    ? styles[`action-button-${variant}`]
                    : "";
                const buttonClassName = [
                  styles["action-button"],
                  variantClassName,
                ]
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
        </div>
      ) : null}
    </div>
  );
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
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canShare: PropTypes.bool,
  onShare: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
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
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canShare: false,
  onShare: undefined,
  canReport: false,
  onReport: undefined,
};

export default memo(OutputToolbar);
