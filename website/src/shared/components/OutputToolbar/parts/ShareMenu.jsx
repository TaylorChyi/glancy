/**
 * 背景：
 *  - 分享菜单需要独立组件承载语义标签与回调防御，避免在主逻辑中混入大量条件渲染。
 * 目的：
 *  - 以组合模式封装菜单项渲染，便于未来扩展更多分享能力。
 * 关键决策与取舍：
 *  - 使用 Promise.resolve 包裹回调，兼容同步与异步实现；
 *  - 保持组件纯展示，状态管理仍由上层 Hook 控制。
 * 影响范围：
 *  - OutputToolbar 的分享交互体验。
 * 演进与TODO：
 *  - 若后续需要权限提示，可在此增加空态项或禁用说明。
 */
import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "../OutputToolbar.module.css";

const renderCopyOption = ({ translator, capabilities, closeMenu }) => {
  if (!capabilities?.hasCopy) return null;
  const handleCopy = () => {
    if (typeof capabilities.onCopyLink !== "function") return;
    Promise.resolve(capabilities.onCopyLink()).finally(closeMenu);
  };
  const label =
    translator.shareOptionLink ||
    translator.shareCopySuccess ||
    translator.share ||
    "Copy link";
  return (
    <button
      type="button"
      role="menuitem"
      className={styles["share-menu-item"]}
      onClick={handleCopy}
    >
      <ThemeIcon name="copy" width={18} height={18} />
      <span>{label}</span>
    </button>
  );
};

const renderImageOption = ({ translator, capabilities, closeMenu }) => {
  if (!capabilities?.hasImage) return null;
  const handleExport = () => {
    if (typeof capabilities.onExportImage !== "function") return;
    Promise.resolve(capabilities.onExportImage()).finally(closeMenu);
  };
  const label =
    translator.shareOptionImage || translator.share || "Export image";
  return (
    <button
      type="button"
      role="menuitem"
      className={styles["share-menu-item"]}
      onClick={handleExport}
      disabled={capabilities.isImageExporting || !capabilities.canExportImage}
      aria-busy={capabilities.isImageExporting ? "true" : undefined}
    >
      <ThemeIcon name="glancy" width={18} height={18} />
      <span>{label}</span>
    </button>
  );
};

function ShareMenu({
  isOpen,
  menuRef,
  capabilities,
  closeMenu,
  translator,
  menuId,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles["share-menu"]}
      role="menu"
      id={menuId}
      aria-label={
        translator.shareMenuLabel || translator.share || "Share options"
      }
      ref={menuRef}
    >
      {renderCopyOption({ translator, capabilities, closeMenu })}
      {renderImageOption({ translator, capabilities, closeMenu })}
    </div>
  );
}

ShareMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  menuRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]).isRequired,
  capabilities: PropTypes.shape({
    hasCopy: PropTypes.bool,
    hasImage: PropTypes.bool,
    onCopyLink: PropTypes.func,
    onExportImage: PropTypes.func,
    isImageExporting: PropTypes.bool,
    canExportImage: PropTypes.bool,
  }),
  closeMenu: PropTypes.func.isRequired,
  translator: PropTypes.shape({
    shareMenuLabel: PropTypes.string,
    share: PropTypes.string,
    shareOptionLink: PropTypes.string,
    shareCopySuccess: PropTypes.string,
    shareOptionImage: PropTypes.string,
  }).isRequired,
  menuId: PropTypes.string,
};

ShareMenu.defaultProps = {
  capabilities: null,
  menuId: undefined,
};

export default ShareMenu;
