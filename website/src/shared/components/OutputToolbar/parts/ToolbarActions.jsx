/**
 * 背景：
 *  - 动作列表与分享菜单在历史实现中耦合紧密，导致渲染层难以维护。
 * 目的：
 *  - 通过消费 useToolbarActionsModel 输出的视图模型，专注于渲染与可访问性声明。
 * 关键决策与取舍：
 *  - 按按钮变体映射样式类，避免在渲染过程中散落条件拼接；
 *  - 分享菜单仍由 Popover 承载，保持与既有交互一致。
 * 影响范围：
 *  - OutputToolbar 动作区域。
 * 演进与TODO：
 *  - 若新增动作，需要在模型 Hook 中扩展策略表即可。
 */
import PropTypes from "prop-types";
import Popover from "@shared/components/ui/Popover/Popover.jsx";
import ShareMenu from "./ShareMenu.jsx";
import styles from "../OutputToolbar.module.css";
import { useToolbarActionsModel } from "../hooks/useToolbarActionsModel.js";

const resolveVariantClass = (variant) => {
  if (!variant) return "";
  return styles[`tool-button-${variant}`] || "";
};

const renderActionButton = ({ item, baseToolButtonClass, shareMenuOpen }) => {
  const variantClass = resolveVariantClass(item.variant);
  const className = [baseToolButtonClass, variantClass]
    .filter(Boolean)
    .join(" ");
  const ariaExpanded = item.hasMenu
    ? shareMenuOpen
      ? "true"
      : "false"
    : undefined;

  return (
    <button
      key={item.key}
      type="button"
      className={className}
      data-active={item.active ? "true" : undefined}
      onClick={item.onClick}
      aria-label={item.label}
      title={item.label}
      disabled={item.disabled}
      ref={item.anchorRef}
      onKeyDown={item.onKeyDown}
      aria-haspopup={item.hasMenu ? "menu" : undefined}
      aria-expanded={ariaExpanded}
    >
      {item.icon}
    </button>
  );
};

function ToolbarActions({ baseToolButtonClass, translator, ...modelProps }) {
  const { items, shareMenu, shareItem } = useToolbarActionsModel({
    translator,
    ...modelProps,
  });

  if (!items.length) {
    return null;
  }

  return (
    <>
      <div className={styles["action-strip"]}>
        {items.map((item) =>
          renderActionButton({
            item,
            baseToolButtonClass,
            shareMenuOpen: shareMenu.isOpen,
          }),
        )}
      </div>
      {shareItem ? (
        <Popover
          isOpen={shareMenu.isOpen}
          anchorRef={shareMenu.anchorBoundaryRef}
          onClose={shareMenu.closeMenu}
          placement="top"
          align="end"
          offset={8}
        >
          <ShareMenu
            isOpen={shareMenu.isOpen}
            menuRef={shareMenu.shareMenuRef}
            capabilities={shareMenu.capabilities}
            closeMenu={shareMenu.closeMenu}
            translator={translator}
          />
        </Popover>
      ) : null}
    </>
  );
}

ToolbarActions.propTypes = {
  translator: PropTypes.shape({
    copyAction: PropTypes.string,
    copySuccess: PropTypes.string,
    share: PropTypes.string,
    favoriteAction: PropTypes.string,
    favoriteRemove: PropTypes.string,
    deleteButton: PropTypes.string,
    deleteAction: PropTypes.string,
    report: PropTypes.string,
  }).isRequired,
  baseToolButtonClass: PropTypes.string.isRequired,
  user: PropTypes.shape({ id: PropTypes.string }),
  disabled: PropTypes.bool.isRequired,
  canCopy: PropTypes.bool,
  onCopy: PropTypes.func,
  copyFeedbackState: PropTypes.string,
  isCopySuccess: PropTypes.bool,
  favorited: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  canFavorite: PropTypes.bool,
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  canReport: PropTypes.bool,
  onReport: PropTypes.func,
  canShare: PropTypes.bool,
  shareModel: PropTypes.shape({
    canShare: PropTypes.bool,
    onCopyLink: PropTypes.func,
    onExportImage: PropTypes.func,
    isImageExporting: PropTypes.bool,
    canExportImage: PropTypes.bool,
    shareUrl: PropTypes.string,
  }),
};

ToolbarActions.defaultProps = {
  user: null,
  canCopy: false,
  onCopy: undefined,
  copyFeedbackState: "idle",
  isCopySuccess: false,
  favorited: false,
  onToggleFavorite: undefined,
  canFavorite: false,
  canDelete: false,
  onDelete: undefined,
  canReport: false,
  onReport: undefined,
  canShare: undefined,
  shareModel: null,
};

export default ToolbarActions;
