/**
 * 背景：
 *  - 账号身份区域在 AccountSection 内部直接构建 DOM，导致主组件体积过大且复用困难。
 * 目的：
 *  - 将身份区域拆分为独立组件，集中处理头像展示与文件选择器交互。
 * 关键决策与取舍：
 *  - 依赖外部传入的事件处理函数，组件内部不持有状态，保持容器与展示分离；
 *  - 以 visually-hidden 的 span 承载昵称，确保读屏工具可读。
 * 影响范围：
 *  - 偏好设置页面的身份区渲染。
 * 演进与TODO：
 *  - 未来支持多尺寸头像时，可在此扩展 responsive props。
 */
import PropTypes from "prop-types";

import Avatar from "@shared/components/ui/Avatar";

import styles from "../Preferences.module.css";

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
    <div className={`${styles["detail-row"]} ${styles["identity-row"]}`}>
      <dt className={`${styles["detail-label"]} ${styles["identity-label"]}`}>
        {identity.label}
      </dt>
      <dd className={`${styles["detail-value"]} ${styles["identity-value"]}`}>
        <Avatar
          width={avatarSize}
          height={avatarSize}
          aria-hidden={!identity.displayName}
          alt={identity.avatarAlt}
          className={styles["identity-avatar-image"]}
        />
        {identity.displayName ? (
          <span className={styles["visually-hidden"]}>{identity.displayName}</span>
        ) : null}
      </dd>
      <div className={styles["detail-action"]}>
        <input
          id={avatarInputId}
          ref={avatarInputRef}
          className={styles["avatar-input"]}
          type="file"
          accept="image/*"
          onChange={onAvatarChange}
        />
        <button
          type="button"
          className={`${styles["avatar-trigger"]} ${styles["detail-action-button"]}`}
          aria-disabled={identity.isUploading}
          disabled={identity.isUploading}
          onClick={onAvatarTrigger}
        >
          {identity.changeLabel}
        </button>
      </div>
    </div>
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
