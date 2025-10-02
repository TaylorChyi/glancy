/**
 * 背景：
 *  - 偏好设置面板切换为多标签模式，需要将账号详情渲染拆分为独立展示层以便策略化组合。
 * 目的：
 *  - 以纯展示组件承载账号字段与操作按钮，供父组件在标签策略中复用。
 * 关键决策与取舍：
 *  - 采用“策略模式”：每个标签以组件作为渲染策略，方便未来扩展不同的偏好模块；对比直接在父组件内条件渲染，可避免逻辑膨胀。
 * 影响范围：
 *  - 仅影响 Preferences 页的“账号”标签渲染，不改动数据获取逻辑。
 * 演进与TODO：
 *  - TODO: 当新增可编辑字段时，在本组件内接入表单控件与验证态展示。
 */
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

function AccountPreferencesTab({
  title,
  description,
  fields,
  headingId,
  descriptionId,
  manageLabel,
  canManageProfile,
  onOpenAccountManager,
}) {
  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
      className={styles.section}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]}>
          {title}
        </h3>
        {description ? (
          <p id={descriptionId} className={styles["section-description"]}>
            {description}
          </p>
        ) : null}
      </div>
      <dl className={styles.details}>
        {fields.map((field) => (
          <div key={field.id} className={styles["detail-row"]}>
            <dt className={styles["detail-label"]}>{field.label}</dt>
            <dd className={styles["detail-value"]}>{field.value}</dd>
          </div>
        ))}
      </dl>
      {canManageProfile ? (
        <footer className={styles.footer}>
          <button
            type="button"
            className={styles["manage-button"]}
            onClick={onOpenAccountManager}
          >
            {manageLabel}
          </button>
        </footer>
      ) : null}
    </section>
  );
}

AccountPreferencesTab.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  manageLabel: PropTypes.string.isRequired,
  canManageProfile: PropTypes.bool,
  onOpenAccountManager: PropTypes.func,
};

AccountPreferencesTab.defaultProps = {
  description: "",
  descriptionId: undefined,
  canManageProfile: false,
  onOpenAccountManager: undefined,
};

export default AccountPreferencesTab;
