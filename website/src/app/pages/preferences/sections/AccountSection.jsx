/**
 * 背景：
 *  - 偏好设置面板的账号信息此前散落在父组件与布局层，难以在模态与页面之间共享。
 * 目的：
 *  - 以纯展示 Section 组件承载账号字段、头像编辑与外部账号绑定预设，供偏好设置的组合式布局复用。
 * 关键决策与取舍：
 *  - 组件保持无状态，仅依赖 props 渲染；拒绝在此处触发数据请求，使其适合作为策略模式中的具体策略。
 *  - 头像与绑定区域采用组合式布局，保留未来接入上传与绑定流程的扩展点；头部排版沿用 Settings 通用节奏。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的账号分区渲染逻辑。
 * 演进与TODO：
 *  - TODO: 当后续支持编辑态，可在此扩展表单控件与验证反馈。
 */
import PropTypes from "prop-types";

import SettingsSection from "@shared/components/settings/SettingsSection";

import AccountBindings from "./AccountBindings.jsx";
import AccountFieldList from "./AccountFieldList.jsx";
import AccountIdentityRow from "./AccountIdentityRow.jsx";
import { useAvatarInteraction } from "./useAvatarInteraction.js";
import { useNormalizedIdentity } from "./useNormalizedIdentity.js";
import styles from "../Preferences.module.css";

const AVATAR_SIZE = 72;

/**
 * 意图：组合账号偏好分区的身份信息、字段列表与绑定信息。
 * 输入：title/fields/headingId/identity/bindings —— 页面装配所需的数据与回调。
 * 输出：包含 SettingsSection 框架的完整分区 JSX。
 * 流程：
 *  1) 通过 useAvatarInteraction 管理头像 input 交互；
 *  2) 使用 useNormalizedIdentity 补全 identity 文案；
 *  3) 装配身份行、字段列表与绑定信息。
 * 错误处理：所有副作用交由上游控制。
 * 复杂度：O(n)，n 为字段数量。
 */
function AccountSection({ title, fields, headingId, identity, bindings }) {
  const { avatarInputId, avatarInputRef, onAvatarTrigger, onAvatarChange } =
    useAvatarInteraction(identity);
  const normalizedIdentity = useNormalizedIdentity(identity, title);

  return (
    <SettingsSection
      headingId={headingId}
      title={title}
      classes={{
        section: `${styles.section} ${styles["section-plain"]}`,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <dl className={styles.details}>
        <AccountIdentityRow
          identity={normalizedIdentity}
          avatarSize={AVATAR_SIZE}
          avatarInputId={avatarInputId}
          avatarInputRef={avatarInputRef}
          onAvatarTrigger={onAvatarTrigger}
          onAvatarChange={onAvatarChange}
        />
        <AccountFieldList fields={fields} headingId={headingId} />
      </dl>
      <AccountBindings bindings={bindings} />
    </SettingsSection>
  );
}

AccountSection.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      renderValue: PropTypes.func,
      type: PropTypes.string,
      readOnlyInputProps: PropTypes.shape({
        type: PropTypes.string,
        inputMode: PropTypes.string,
        autoComplete: PropTypes.string,
        name: PropTypes.string,
        placeholder: PropTypes.string,
      }),
      usernameEditorProps: PropTypes.shape({
        username: PropTypes.string,
        emptyDisplayValue: PropTypes.string,
        onSubmit: PropTypes.func,
        onSuccess: PropTypes.func,
        onFailure: PropTypes.func,
        t: PropTypes.func,
        inputClassName: PropTypes.string,
      }),
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        onClick: PropTypes.func,
        isPending: PropTypes.bool,
        pendingLabel: PropTypes.string,
      }),
    }),
  ).isRequired,
  headingId: PropTypes.string.isRequired,
  identity: PropTypes.shape({
    label: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    changeLabel: PropTypes.string.isRequired,
    avatarAlt: PropTypes.string,
    onSelectAvatar: PropTypes.func,
    isUploading: PropTypes.bool,
  }).isRequired,
  bindings: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        actionLabel: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default AccountSection;
