import PropTypes from "prop-types";
import { memo, useMemo, useCallback, useState, useRef, useEffect } from "react";
import { TtsButton } from "@/components";
import ThemeIcon from "@/components/ui/Icon";
import { useLanguage, useUser } from "@/context";
import SelectMenu from "@/components/ui/SelectMenu";
import Popover from "@/components/ui/Popover/Popover.jsx";
import useMenuNavigation from "@/hooks/useMenuNavigation.js";
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
  onSelectVersion,
  ttsComponent = TtsButton,
  onCopy,
  canCopy = false,
  copyFeedbackState = "idle",
  isCopySuccess = false,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  canDelete = false,
  onDelete,
  canShare = undefined,
  shareModel = null,
  canReport = false,
  onReport,
  className,
  role: toolbarRole = "toolbar",
  ariaLabel = "词条工具栏",
  renderRoot = defaultRenderRoot,
}) {
  const { t } = useLanguage();
  const { user } = useUser();
  const normalizedTerm = typeof term === "string" ? term.trim() : "";
  const TtsComponent = ttsComponent;
  const copySuccessActive = Boolean(
    isCopySuccess || copyFeedbackState === "success",
  );
  const copyBaseLabel = t.copyAction || "Copy";
  const copyResolvedLabel = copySuccessActive
    ? t.copySuccess || copyBaseLabel
    : copyBaseLabel;
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

  /**
   * 背景：
   *  - 工具栏需在多版本词条之间切换，同时保持视觉节奏与语义可读性。
   * 目的：
   *  - 将版本集合映射为 SelectMenu 识别的选项结构，并按照本地化格式化时间。
   * 关键决策与取舍：
   *  - 复用 Intl.DateTimeFormat（策略模式的具体实现）以抽象不同语言的时间格式，
   *    放弃手写格式化逻辑以降低维护成本；
   *  - 当缺失时间戳时退化到差异化的 term 标签，保证选项仍具区分度。
   */
  const versionOptions = useMemo(() => {
    if (!Array.isArray(versions) || versions.length === 0) {
      return [];
    }

    const locale = lang === "en" ? "en-US" : "zh-CN";
    let formatter = null;
    try {
      formatter = new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      formatter = null;
    }

    const template = t.versionOptionLabel || "Version {index}";

    return versions.map((candidate, index) => {
      const value = candidate?.id ?? candidate?.versionId ?? String(index);
      const label = template.replace("{index}", String(index + 1));
      const timestamp = candidate?.createdAt ?? candidate?.metadata?.createdAt;
      let description;
      if (timestamp && formatter) {
        try {
          description = formatter.format(new Date(timestamp));
        } catch {
          description = undefined;
        }
      }
      if (!description) {
        const versionTerm =
          typeof candidate?.term === "string" ? candidate.term.trim() : "";
        if (versionTerm && versionTerm !== normalizedTerm) {
          description = versionTerm;
        }
      }
      return {
        value: value != null ? String(value) : String(index),
        label,
        description,
      };
    });
  }, [versions, lang, t.versionOptionLabel, normalizedTerm]);

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
      canReport,
      onReport,
      disabled,
    ],
  );

  const shareCapabilities = useMemo(() => {
    if (!shareModel || typeof shareModel !== "object") return null;
    const {
      canShare: shareEnabled = true,
      onCopyLink,
      onExportImage,
      isImageExporting = false,
      canExportImage = true,
      shareUrl: shareTarget,
    } = shareModel;
    return {
      hasCopy: typeof onCopyLink === "function",
      hasImage: typeof onExportImage === "function",
      onCopyLink,
      onExportImage,
      isImageExporting: Boolean(isImageExporting),
      canExportImage: Boolean(canExportImage),
      canShare: Boolean(shareEnabled),
      shareUrl: shareTarget,
    };
  }, [shareModel]);

  const shareTriggerRef = useRef(null);
  const shareMenuRef = useRef(null);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useMenuNavigation(
    shareMenuOpen,
    shareMenuRef,
    shareTriggerRef,
    setShareMenuOpen,
  );

  const shareMenuAvailable = Boolean(
    shareCapabilities &&
      (shareCapabilities.hasCopy || shareCapabilities.hasImage),
  );
  const shareAccessGranted = useMemo(() => {
    /**
     * 背景：词典页在不同状态下由外部状态机决定是否允许分享。
     * 取舍：若父级未显式传入 canShare，则回落到 shareModel 自身的能力判定，
     *       避免因默认值 false 造成按钮被错误禁用。
     */
    if (typeof canShare === "boolean") {
      return canShare;
    }
    if (shareCapabilities) {
      return shareCapabilities.canShare !== false;
    }
    return false;
  }, [canShare, shareCapabilities]);

  const shareButtonDisabled =
    disabled || !shareAccessGranted || !shareMenuAvailable;
  // 设计取舍：分享需向未注册访客开放，因而不再依赖 user；仍保留其他禁用条件避免误触。

  useEffect(() => {
    if (!shareMenuAvailable || shareButtonDisabled) {
      setShareMenuOpen(false);
    }
  }, [shareMenuAvailable, shareButtonDisabled]);

  const closeShareMenu = useCallback(() => {
    setShareMenuOpen(false);
  }, []);

  const handleShareTriggerClick = useCallback(() => {
    if (shareButtonDisabled) return;
    setShareMenuOpen((open) => !open);
  }, [shareButtonDisabled]);

  const handleShareTriggerKeyDown = useCallback(
    (event) => {
      if (shareButtonDisabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setShareMenuOpen(true);
      }
    },
    [shareButtonDisabled],
  );

  const actionItems = useMemo(() => {
    const copyIcon = copySuccessActive ? (
      <ThemeIcon name="copy-success" width={20} height={20} />
    ) : (
      <ThemeIcon name="copy" width={20} height={20} />
    );
    const copyButtonDisabled =
      disabled || copySuccessActive || !canCopy || typeof onCopy !== "function";
    const items = [
      {
        key: "copy",
        label: copyResolvedLabel,
        icon: copyIcon,
        onClick: onCopy,
        active: false,
        variant: "copy",
        disabled: copyButtonDisabled,
      },
    ];

    const shareItem = shareMenuAvailable
      ? {
          key: "share",
          label: t.share || "Share",
          icon: <ThemeIcon name="link" width={20} height={20} />,
          onClick: handleShareTriggerClick,
          active: shareMenuOpen,
          variant: "share",
          disabled: shareButtonDisabled,
          anchorRef: shareTriggerRef,
          hasMenu: true,
        }
      : null;
    let shareInserted = false;

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

      if (blueprint.key === "report" && shareItem && !shareInserted) {
        items.push(shareItem);
        shareInserted = true;
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

    if (shareItem && !shareInserted) {
      items.push(shareItem);
    }

    return items;
  }, [
    actionContext,
    canCopy,
    copyResolvedLabel,
    copySuccessActive,
    disabled,
    handleShareTriggerClick,
    shareMenuAvailable,
    shareMenuOpen,
    shareButtonDisabled,
    onCopy,
    t.share,
    user,
  ]);

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

  const canSelectVersion =
    typeof onSelectVersion === "function" &&
    !disabled &&
    versionOptions.length > 1;
  const versionSelectValue =
    activeVersionId != null ? String(activeVersionId) : "";
  const versionMenuLabel = t.versionMenuLabel || "Select version";
  const handleVersionSelect = useCallback(
    (value) => {
      if (!canSelectVersion) return;
      if (value == null) return;
      onSelectVersion?.(String(value));
    },
    [canSelectVersion, onSelectVersion],
  );

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
        <>
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
                anchorRef,
                hasMenu,
              }) => {
                const variantClassName =
                  variant && styles[`tool-button-${variant}`]
                    ? styles[`tool-button-${variant}`]
                    : "";
                const buttonClassName = [baseToolButtonClass, variantClassName]
                  .filter(Boolean)
                  .join(" ");
                const buttonProps = {};
                if (anchorRef) {
                  buttonProps.ref = anchorRef;
                }
                if (hasMenu) {
                  buttonProps["aria-haspopup"] = "menu";
                  buttonProps["aria-expanded"] = shareMenuOpen
                    ? "true"
                    : "false";
                  buttonProps.onKeyDown = handleShareTriggerKeyDown;
                }

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
                    {...buttonProps}
                  >
                    {icon}
                  </button>
                );
              },
            )}
          </div>
          {shareMenuAvailable ? (
            <Popover
              isOpen={shareMenuOpen}
              anchorRef={shareTriggerRef}
              onClose={closeShareMenu}
              placement="top"
              align="end"
              offset={8}
            >
              {shareMenuOpen ? (
                <div
                  className={styles["share-menu"]}
                  role="menu"
                  aria-label={t.shareMenuLabel || t.share || "Share options"}
                  ref={shareMenuRef}
                >
                  {shareCapabilities?.hasCopy ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles["share-menu-item"]}
                      onClick={() => {
                        if (typeof shareCapabilities.onCopyLink !== "function")
                          return;
                        Promise.resolve(shareCapabilities.onCopyLink()).finally(
                          closeShareMenu,
                        );
                      }}
                    >
                      <ThemeIcon name="copy" width={18} height={18} />
                      <span>
                        {t.shareOptionLink ||
                          t.shareCopySuccess ||
                          t.share ||
                          "Copy link"}
                      </span>
                    </button>
                  ) : null}
                  {shareCapabilities?.hasImage ? (
                    <button
                      type="button"
                      role="menuitem"
                      className={styles["share-menu-item"]}
                      onClick={() => {
                        if (
                          typeof shareCapabilities.onExportImage !== "function"
                        )
                          return;
                        Promise.resolve(
                          shareCapabilities.onExportImage(),
                        ).finally(closeShareMenu);
                      }}
                      disabled={
                        shareCapabilities.isImageExporting ||
                        !shareCapabilities.canExportImage
                      }
                      aria-busy={
                        shareCapabilities.isImageExporting ? "true" : undefined
                      }
                    >
                      <ThemeIcon name="glancy" width={18} height={18} />
                      <span>
                        {t.shareOptionImage || t.share || "Export image"}
                      </span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </Popover>
          ) : null}
        </>
      ) : null}
      <div
        className={`${styles["version-dial"]} entry__pager`}
        role="group"
        aria-label={pagerLabel}
      >
        <button
          type="button"
          className={`${baseToolButtonClass} ${styles["nav-button"]}`}
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
        {canSelectVersion ? (
          <div className={styles["version-menu"]}>
            <SelectMenu
              id="output-toolbar-version-menu"
              options={versionOptions}
              value={versionSelectValue}
              onChange={handleVersionSelect}
              ariaLabel={versionMenuLabel}
            />
          </div>
        ) : null}
        <span
          className={styles.indicator}
          aria-live="polite"
          aria-atomic="true"
        >
          {indicator}
        </span>
        <button
          type="button"
          className={`${baseToolButtonClass} ${styles["nav-button"]}`}
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
  onSelectVersion: PropTypes.func,
  ttsComponent: PropTypes.elementType,
  onCopy: PropTypes.func,
  canCopy: PropTypes.bool,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canShare: PropTypes.bool,
  shareModel: PropTypes.shape({
    canShare: PropTypes.bool,
    onCopyLink: PropTypes.func,
    onExportImage: PropTypes.func,
    isImageExporting: PropTypes.bool,
    canExportImage: PropTypes.bool,
    shareUrl: PropTypes.string,
  }),
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
  onSelectVersion: undefined,
  ttsComponent: TtsButton,
  onCopy: undefined,
  canCopy: false,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canShare: undefined,
  shareModel: null,
  canReport: false,
  onReport: undefined,
  className: "",
  role: "toolbar",
  ariaLabel: "词条工具栏",
  renderRoot: defaultRenderRoot,
};

export default memo(OutputToolbar);
