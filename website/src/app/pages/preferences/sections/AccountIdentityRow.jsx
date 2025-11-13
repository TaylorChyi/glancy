import PropTypes from "prop-types";

import Avatar from "@shared/components/ui/Avatar";

import styles from "../Preferences.module.css";

const IdentityRowLayout = ({ children }) => (
  <div className={`${styles["detail-row"]} ${styles["identity-row"]}`}>
    {children}
  </div>
);

IdentityRowLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

const IdentityLabel = ({ label }) => (
  <dt className={`${styles["detail-label"]} ${styles["identity-label"]}`}>
    {label}
  </dt>
);

IdentityLabel.propTypes = {
  label: PropTypes.string.isRequired,
};

const IdentityAvatarDisplay = ({ avatarAlt, displayName, avatarSize }) => (
  <dd className={`${styles["detail-value"]} ${styles["identity-value"]}`}>
    <Avatar
      width={avatarSize}
      height={avatarSize}
      aria-hidden={!displayName}
      alt={avatarAlt}
      className={styles["identity-avatar-image"]}
    />
    {displayName ? (
      <span className={styles["visually-hidden"]}>{displayName}</span>
    ) : null}
  </dd>
);

IdentityAvatarDisplay.propTypes = {
  avatarAlt: PropTypes.string.isRequired,
  displayName: PropTypes.string,
  avatarSize: PropTypes.number.isRequired,
};

IdentityAvatarDisplay.defaultProps = {
  displayName: undefined,
};

const AvatarUploadControl = ({
  changeLabel,
  isUploading,
  inputId,
  inputRef,
  onTrigger,
  onChange,
}) => (
  <div className={styles["detail-action"]}>
    <input
      id={inputId}
      ref={inputRef}
      className={styles["avatar-input"]}
      type="file"
      accept="image/*"
      onChange={onChange}
    />
    <button
      type="button"
      className={`${styles["avatar-trigger"]} ${styles["detail-action-button"]}`}
      aria-disabled={isUploading}
      disabled={isUploading}
      onClick={onTrigger}
    >
      {changeLabel}
    </button>
  </div>
);

AvatarUploadControl.propTypes = {
  changeLabel: PropTypes.string.isRequired,
  isUploading: PropTypes.bool.isRequired,
  inputId: PropTypes.string.isRequired,
  inputRef: PropTypes.shape({ current: PropTypes.any }),
  onTrigger: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

AvatarUploadControl.defaultProps = {
  inputRef: undefined,
};

/**
 * 意图：渲染账号身份行，包括头像展示、隐藏的昵称文本与触发头像上传的按钮。
 * 输入：identity —— 归一化后的身份文案；avatarSize —— 头像尺寸；inputId/ref —— 关联 file input。
 * 输出：detail 行节点。
 * 流程：
 *  1) 渲染 Avatar 组件并以 aria-hidden 控制是否暴露给读屏；
 *  2) 若 displayName 存在则输出 visually-hidden 文本；
 *  3) 绑定文件选择器与触发按钮。
 * 错误处理：文件选择错误交由上层处理。
 * 复杂度：O(1)。
 */
function AccountIdentityRow({
  identity,
  avatarSize,
  avatarInputId,
  avatarInputRef,
  onAvatarTrigger,
  onAvatarChange,
}) {
  return (
    <IdentityRowLayout>
      <IdentityLabel label={identity.label} />
      <IdentityAvatarDisplay
        avatarAlt={identity.avatarAlt}
        displayName={identity.displayName}
        avatarSize={avatarSize}
      />
      <AvatarUploadControl
        changeLabel={identity.changeLabel}
        isUploading={identity.isUploading}
        inputId={avatarInputId}
        inputRef={avatarInputRef}
        onTrigger={onAvatarTrigger}
        onChange={onAvatarChange}
      />
    </IdentityRowLayout>
  );
}

AccountIdentityRow.propTypes = {
  identity: PropTypes.shape({
    label: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    changeLabel: PropTypes.string.isRequired,
    avatarAlt: PropTypes.string.isRequired,
    isUploading: PropTypes.bool.isRequired,
  }).isRequired,
  avatarSize: PropTypes.number.isRequired,
  avatarInputId: PropTypes.string.isRequired,
  avatarInputRef: PropTypes.shape({ current: PropTypes.any }),
  onAvatarTrigger: PropTypes.func.isRequired,
  onAvatarChange: PropTypes.func.isRequired,
};

AccountIdentityRow.defaultProps = {
  avatarInputRef: undefined,
};

export default AccountIdentityRow;
