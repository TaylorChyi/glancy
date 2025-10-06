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
import { useCallback, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Avatar from "@/components/ui/Avatar";
import UsernameEditor from "@/components/Profile/UsernameEditor";
import { ACCOUNT_USERNAME_FIELD_TYPE } from "./accountSection.constants.js";
import styles from "../Preferences.module.css";

const AVATAR_SIZE = 72;

/**
 * 意图：在账号详情表格中以分栏布局呈现用户名编辑能力，确保操作按钮落位于统一的动作列。
 * 输入：field —— AccountSection 字段配置，包含用户名展示与编辑所需的 props。
 * 输出：返回包含标签、值列（输入框）与动作列（按钮）的行节点。
 * 流程：
 *  1) 通过 UsernameEditor 的 onResolveAction 回调提取按钮交互描述；
 *  2) 在值列渲染输入控件，动作列渲染统一风格的按钮；
 *  3) 根据描述更新按钮禁用态与点击行为。
 * 错误处理：用户名校验与异步错误交由 UsernameEditor 内部处理。
 * 复杂度：O(1)。
 */
function UsernameFieldRow({ field }) {
  const [actionDescriptor, setActionDescriptor] = useState(null);

  const handleResolveAction = useCallback((descriptor) => {
    if (!descriptor) {
      setActionDescriptor(null);
      return;
    }

    setActionDescriptor((current) => {
      if (
        current &&
        current.label === descriptor.label &&
        current.disabled === descriptor.disabled &&
        current.mode === descriptor.mode &&
        current.onClick === descriptor.onClick
      ) {
        return current;
      }
      return descriptor;
    });
  }, []);

  const buttonClassName = `${styles["avatar-trigger"]} ${styles["detail-action-button"]}`;
  const isDisabled = Boolean(actionDescriptor?.disabled);

  return (
    <div className={styles["detail-row"]}>
      <dt className={styles["detail-label"]}>{field.label}</dt>
      <dd className={styles["detail-value"]}>
        <UsernameEditor
          {...field.usernameEditorProps}
          renderInlineAction={false}
          onResolveAction={handleResolveAction}
        />
      </dd>
      <div className={styles["detail-action"]}>
        {actionDescriptor ? (
          <button
            type="button"
            className={buttonClassName}
            onClick={actionDescriptor.onClick}
            disabled={isDisabled}
            aria-disabled={isDisabled ? "true" : "false"}
          >
            {actionDescriptor.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

UsernameFieldRow.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    usernameEditorProps: PropTypes.shape({
      username: PropTypes.string,
      emptyDisplayValue: PropTypes.string,
      onSubmit: PropTypes.func,
      onSuccess: PropTypes.func,
      onFailure: PropTypes.func,
      t: UsernameEditor.propTypes.t,
    }).isRequired,
  }).isRequired,
};

function AccountSection({ title, fields, headingId, identity, bindings }) {
  const avatarInputId = useId();
  const avatarInputRef = useRef(null);
  const handleAvatarTrigger = useCallback(() => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  }, []);
  const handleAvatarChange = useCallback(
    (event) => {
      identity?.onSelectAvatar?.(event.target.files ?? null);
      if (event?.target) {
        // 重置 input 以便用户选择相同文件时仍能触发 change 事件。
        event.target.value = "";
      }
    },
    [identity],
  );

  const normalizedIdentity = useMemo(() => {
    const fallbackLabel = identity?.changeLabel ?? "Avatar";
    return {
      label: identity?.label ?? fallbackLabel,
      displayName: identity?.displayName ?? "",
      changeLabel: identity?.changeLabel ?? "Change avatar",
      avatarAlt: identity?.avatarAlt ?? title,
      isUploading: Boolean(identity?.isUploading),
    };
  }, [
    identity?.avatarAlt,
    identity?.changeLabel,
    identity?.displayName,
    identity?.label,
    identity?.isUploading,
    title,
  ]);

  return (
    <section
      aria-labelledby={headingId}
      className={`${styles.section} ${styles["section-plain"]}`}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>
      <dl className={styles.details}>
        <div className={`${styles["detail-row"]} ${styles["identity-row"]}`}>
          <dt
            className={`${styles["detail-label"]} ${styles["identity-label"]}`}
          >
            {normalizedIdentity.label}
          </dt>
          <dd
            className={`${styles["detail-value"]} ${styles["identity-value"]}`}
          >
            <Avatar
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              aria-hidden={!normalizedIdentity.displayName}
              alt={normalizedIdentity.avatarAlt}
              className={styles["identity-avatar-image"]}
            />
            {normalizedIdentity.displayName ? (
              <span className={styles["visually-hidden"]}>
                {normalizedIdentity.displayName}
              </span>
            ) : null}
          </dd>
          <div className={styles["detail-action"]}>
            <input
              id={avatarInputId}
              ref={avatarInputRef}
              className={styles["avatar-input"]}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              className={`${styles["avatar-trigger"]} ${styles["detail-action-button"]}`}
              aria-disabled={normalizedIdentity.isUploading}
              disabled={normalizedIdentity.isUploading}
              onClick={handleAvatarTrigger}
            >
              {normalizedIdentity.changeLabel}
            </button>
          </div>
        </div>
        {fields.map((field) => {
          if (field.type === ACCOUNT_USERNAME_FIELD_TYPE) {
            return <UsernameFieldRow key={field.id} field={field} />;
          }

          const renderValue = field.renderValue;
          return (
            <div key={field.id} className={styles["detail-row"]}>
              <dt className={styles["detail-label"]}>{field.label}</dt>
              <dd className={styles["detail-value"]}>
                {typeof renderValue === "function" ? renderValue(field) : field.value}
              </dd>
              <div className={styles["detail-action"]}>
                {field.action ? (
                  <button
                    type="button"
                    className={`${styles["avatar-trigger"]} ${styles["detail-action-button"]}`}
                    aria-disabled={field.action.disabled}
                    disabled={field.action.disabled}
                  >
                    {field.action.label}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </dl>
      {bindings ? (
        <div className={styles.bindings} aria-live="polite">
          <h4 className={styles["bindings-title"]}>{bindings.title}</h4>
          <ul className={styles["bindings-list"]}>
            {bindings.items.map((binding) => (
              <li key={binding.id} className={styles["binding-item"]}>
                <div className={styles["binding-copy"]}>
                  <span className={styles["binding-name"]}>{binding.name}</span>
                  <span className={styles["binding-status"]}>
                    {binding.status}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles["binding-action"]}
                  aria-disabled="true"
                  disabled
                >
                  {binding.actionLabel}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
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
      usernameEditorProps: PropTypes.shape({
        username: PropTypes.string,
        emptyDisplayValue: PropTypes.string,
        onSubmit: PropTypes.func,
        onSuccess: PropTypes.func,
        onFailure: PropTypes.func,
        t: UsernameEditor.propTypes.t,
      }),
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
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
