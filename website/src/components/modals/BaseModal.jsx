import PropTypes from "prop-types";
import Modal from "./Modal.jsx";
import { useLanguage } from "@/context";

/**
 * 背景：
 *  - 多个弹窗需要不同的关闭交互，之前的实现强制渲染统一的图标按钮。
 * 目的：
 *  - 为上层提供自定义关闭控件与隐藏默认按钮的能力，以契合不同的视觉与无障碍需求。
 * 关键决策与取舍：
 *  - 通过向底层 Modal 透传插槽而非新增状态管理，保持组件纯粹性，避免破坏现有的焦点管理逻辑。
 */
function BaseModal({
  open,
  onClose,
  className = "",
  children,
  closeLabel,
  closeButton,
  hideDefaultCloseButton = false,
}) {
  const { t } = useLanguage();
  if (!open) return null;

  const resolvedCloseLabel = closeLabel ?? t.close;

  return (
    <Modal
      onClose={onClose}
      className={className}
      closeLabel={resolvedCloseLabel}
      closeButton={closeButton}
      hideDefaultCloseButton={hideDefaultCloseButton}
    >
      {children}
    </Modal>
  );
}

BaseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  closeLabel: PropTypes.string,
  closeButton: PropTypes.node,
  hideDefaultCloseButton: PropTypes.bool,
};

export default BaseModal;
