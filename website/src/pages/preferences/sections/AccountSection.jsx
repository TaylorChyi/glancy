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
import { useCallback, useId, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import Avatar from "@/components/ui/Avatar";
import styles from "../Preferences.module.css";

const AVATAR_SIZE = 72;

function AccountSection({
  title,
  fields,
  headingId,
  identity,
  bindings,
}) {
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

  const normalizedIdentity = useMemo(
    () => ({
      label: identity?.label ?? identity?.changeLabel ?? title,
      displayName: identity?.displayName ?? "",
      changeLabel: identity?.changeLabel ?? "Change avatar",
      avatarAlt: identity?.avatarAlt ?? title,
    }),
    [
      identity?.avatarAlt,
      identity?.changeLabel,
      identity?.displayName,
      identity?.label,
      title,
    ],
  );

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
              onClick={handleAvatarTrigger}
            >
              {normalizedIdentity.changeLabel}
            </button>
          </div>
        </div>
        {fields.map((field) => {
          const isEditableField = Boolean(field.editable);
          const inputId = `${field.id}-input`;
          const errorId = `${field.id}-error`;
          const editable = field.editable;

          const renderValue = () => {
            if (!isEditableField || editable.mode === "view") {
              return field.value;
            }

            const inputClassNames = [styles["editable-input"]];
            if (editable.errorMessage) {
              inputClassNames.push(styles["editable-input-error"]);
            }

            return (
              <div className={styles["editable-value"]}>
                <input
                  id={inputId}
                  name={editable.name ?? field.id}
                  type="text"
                  value={editable.draftValue}
                  onChange={editable.onChange}
                  placeholder={editable.placeholder}
                  disabled={editable.isBusy}
                  autoFocus={editable.mode === "edit"}
                  aria-invalid={Boolean(editable.errorMessage)}
                  aria-describedby={
                    editable.errorMessage ? errorId : undefined
                  }
                  className={inputClassNames.join(" ")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      editable.onSubmit();
                    }
                  }}
                />
                {editable.errorMessage ? (
                  <p id={errorId} className={styles["editable-error"]}>
                    {editable.errorMessage}
                  </p>
                ) : null}
              </div>
            );
          };

          return (
            <div key={field.id} className={styles["detail-row"]}>
              <dt className={styles["detail-label"]}>{field.label}</dt>
              <dd className={styles["detail-value"]}>{renderValue()}</dd>
              <div className={styles["detail-action"]}>
                {isEditableField ? (
                  <button
                    type="button"
                    className={`${styles["avatar-trigger"]} ${styles["detail-action-button"]}`}
                    onClick={editable.onSubmit}
                    disabled={editable.isBusy}
                  >
                    {editable.buttonLabel}
                  </button>
                ) : field.action ? (
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
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
      }),
      editable: PropTypes.shape({
        mode: PropTypes.oneOf(["view", "edit", "saving"]).isRequired,
        draftValue: PropTypes.string.isRequired,
        placeholder: PropTypes.string,
        buttonLabel: PropTypes.string.isRequired,
        isBusy: PropTypes.bool,
        errorMessage: PropTypes.string,
        onChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        name: PropTypes.string,
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
