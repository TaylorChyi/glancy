/**
 * 背景：
 *  - 偏好设置面板的账号信息此前散落在父组件与布局层，难以在模态与页面之间共享。
 * 目的：
 *  - 以纯展示 Section 组件承载账号字段、描述及管理入口，供偏好设置的组合式布局复用。
 * 关键决策与取舍：
 *  - 组件保持无状态，仅依赖 props 渲染；拒绝在此处触发数据请求，使其适合作为策略模式中的具体策略。
 *  - 头部排版遵循 Settings 通用分区规范，统一加入视觉分隔符以匹配全局节奏。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的账号分区渲染逻辑。
 * 演进与TODO：
 *  - TODO: 当后续支持编辑态，可在此扩展表单控件与验证反馈。
 */
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

function AccountSection({
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
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        {description ? (
          <p id={descriptionId} className={styles["section-description"]}>
            {description}
          </p>
        ) : null}
        <div className={styles["section-divider"]} aria-hidden="true" />
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

AccountSection.propTypes = {
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

AccountSection.defaultProps = {
  description: "",
  descriptionId: undefined,
  canManageProfile: false,
  onOpenAccountManager: undefined,
};

export default AccountSection;
