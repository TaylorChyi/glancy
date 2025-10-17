/**
 * 背景：
 *  - 视图层曾夹杂大量派生逻辑，使组件难以阅读并阻碍 lint 结构化规则落地。
 * 目的：
 *  - 接收控制器提供的视图模型并负责纯渲染，确保 UI 层保持声明式与可测试。
 * 关键决策与取舍：
 *  - 通过拆分 Header/Form/Summary 子组件，降低单个函数体量以满足结构化规则；
 *  - 保留原有语义结构与辅助文本，避免引入视觉层面的额外变更。
 * 影响范围：
 *  - EmailBindingCard 的渲染结构；
 *  - 未来如需扩展布局，可在 viewModel 中扩展字段而无需修改控制器。
 * 演进与TODO：
 *  - 若需支持 skeleton/加载态，可在此增加条件渲染分支但保持数据驱动。
 */
import PropTypes from "prop-types";
import styles from "./EmailBindingCard.module.css";

const STATUS_CLASSNAME = {
  "status-active": styles["status-active"],
  "status-inactive": styles["status-inactive"],
};

const flowPropType = PropTypes.shape({
  stepInputLabel: PropTypes.string.isRequired,
  stepVerifyLabel: PropTypes.string.isRequired,
  isAwaitingVerification: PropTypes.bool.isRequired,
}).isRequired;

const emailFieldPropType = PropTypes.shape({
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
}).isRequired;

const codeFieldPropType = PropTypes.shape({
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
}).isRequired;

const sendCodeButtonPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
}).isRequired;

const confirmButtonPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
}).isRequired;

const cancelButtonPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}).isRequired;

const summaryPropType = PropTypes.shape({
  isVisible: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  currentEmail: PropTypes.string.isRequired,
  primaryActionLabel: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired,
  secondaryActionLabel: PropTypes.string.isRequired,
  onUnbind: PropTypes.func.isRequired,
  isSecondaryDisabled: PropTypes.bool.isRequired,
}).isRequired;

const headerPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  statusLabel: PropTypes.string.isRequired,
  statusClassName: PropTypes.string.isRequired,
}).isRequired;

const editingPropType = PropTypes.shape({
  isActive: PropTypes.bool.isRequired,
  flow: flowPropType,
  emailField: emailFieldPropType,
  codeField: codeFieldPropType,
  sendCodeButton: sendCodeButtonPropType,
  confirmButton: confirmButtonPropType,
  cancelButton: cancelButtonPropType,
  onSubmit: PropTypes.func.isRequired,
}).isRequired;

function EmailBindingHeader({ header }) {
  const statusClassName = STATUS_CLASSNAME[header.statusClassName] ?? styles["status-inactive"];
  return (
    <header className={styles.header}>
      <div>
        <h3 className={styles.title}>{header.title}</h3>
        <p className={styles.subtitle}>{header.subtitle}</p>
      </div>
      <span className={statusClassName}>{header.statusLabel}</span>
    </header>
  );
}

EmailBindingHeader.propTypes = {
  header: headerPropType,
};

function FlowIndicator({ flow }) {
  return (
    <div className={styles.flow} aria-hidden="true">
      <div className={styles["flow-item"]}>
        <span className={`${styles["flow-dot"]} ${styles["flow-dot-active"]}`}>1</span>
        <span className={styles["flow-label"]}>{flow.stepInputLabel}</span>
      </div>
      <span className={styles["flow-divider"]} />
      <div className={styles["flow-item"]}>
        <span
          className={`${styles["flow-dot"]} ${flow.isAwaitingVerification ? styles["flow-dot-active"] : ""}`}
        >
          2
        </span>
        <span className={styles["flow-label"]}>{flow.stepVerifyLabel}</span>
      </div>
    </div>
  );
}

FlowIndicator.propTypes = {
  flow: flowPropType,
};

function EmailField({ field }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{field.label}</span>
      <input
        value={field.value}
        onChange={field.onChange}
        className={styles.input}
        placeholder={field.placeholder}
        type="email"
        required
      />
      <span className={styles.helper}>{field.helper}</span>
    </label>
  );
}

EmailField.propTypes = {
  field: emailFieldPropType,
};

function VerificationRow({ codeField, sendCodeButton }) {
  return (
    <div className={styles["code-row"]}>
      <label className={styles["code-field"]}>
        <span className={styles.label}>{codeField.label}</span>
        <input
          value={codeField.value}
          onChange={codeField.onChange}
          className={styles.input}
          placeholder={codeField.placeholder}
          inputMode="numeric"
          maxLength={8}
          required
          disabled={codeField.disabled}
        />
        <span className={styles.helper}>{codeField.helper}</span>
      </label>
      <button
        type="button"
        className={styles["secondary-button"]}
        onClick={sendCodeButton.onClick}
        disabled={sendCodeButton.disabled}
      >
        {sendCodeButton.label}
      </button>
    </div>
  );
}

VerificationRow.propTypes = {
  codeField: codeFieldPropType,
  sendCodeButton: sendCodeButtonPropType,
};

function FormActions({ confirmButton, cancelButton }) {
  return (
    <div className={styles["form-actions"]}>
      <button
        type="submit"
        className={styles["primary-button"]}
        disabled={confirmButton.disabled}
      >
        {confirmButton.label}
      </button>
      <button
        type="button"
        className={styles["ghost-button"]}
        onClick={cancelButton.onClick}
      >
        {cancelButton.label}
      </button>
    </div>
  );
}

FormActions.propTypes = {
  confirmButton: confirmButtonPropType,
  cancelButton: cancelButtonPropType,
};

function EmailBindingEditingForm({ editing }) {
  return (
    <form className={styles.form} onSubmit={editing.onSubmit}>
      <FlowIndicator flow={editing.flow} />
      <EmailField field={editing.emailField} />
      <VerificationRow
        codeField={editing.codeField}
        sendCodeButton={editing.sendCodeButton}
      />
      <FormActions
        confirmButton={editing.confirmButton}
        cancelButton={editing.cancelButton}
      />
    </form>
  );
}

EmailBindingEditingForm.propTypes = {
  editing: editingPropType,
};

function EmailBindingSummary({ summary }) {
  return (
    <div className={styles.summary}>
      <div className={styles["summary-info"]}>
        <span className={styles["summary-label"]}>{summary.label}</span>
        <span className={styles["summary-value"]}>{summary.currentEmail}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles["primary-button"]}
          onClick={summary.onStart}
        >
          {summary.primaryActionLabel}
        </button>
        <button
          type="button"
          className={styles["secondary-button"]}
          onClick={summary.onUnbind}
          disabled={summary.isSecondaryDisabled}
        >
          {summary.secondaryActionLabel}
        </button>
      </div>
    </div>
  );
}

EmailBindingSummary.propTypes = {
  summary: summaryPropType,
};

function EmailBindingCardView({ header, editing, summary }) {
  return (
    <section className={styles.card} aria-label={header.title}>
      <EmailBindingHeader header={header} />
      {editing.isActive ? (
        <EmailBindingEditingForm editing={editing} />
      ) : (
        <EmailBindingSummary summary={summary} />
      )}
    </section>
  );
}

EmailBindingCardView.propTypes = {
  header: headerPropType,
  editing: editingPropType,
  summary: summaryPropType,
};

export default EmailBindingCardView;
