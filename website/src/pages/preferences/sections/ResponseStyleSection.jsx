/**
 * 背景：
 *  - 偏好设置原有的个性画像分区仅展示静态摘要，无法满足响应风格切换与即时保存的需求。
 * 目的：
 *  - 提供具备自动保存能力的表单视图，允许用户调整响应语气及关联背景字段。
 * 关键决策与取舍：
 *  - 组件保持无状态，所有状态机逻辑交由 responseStyleModel 统一管理；
 *  - 采用语义化的列表结构 (dl/dt/dd) 以沿用既有详情布局，避免打破页面节奏；
 *  - 通过 aria-live 与按钮回退机制确保加载/错误态可感知。
 * 影响范围：
 *  - Preferences 页面“响应风格”分区的可编辑体验。
 * 演进与TODO：
 *  - TODO: 后续可补充字段级校验与保存失败的逐项提示。
 */
import { useId } from "react";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const isMeaningful = (value) => typeof value === "string" && value.trim().length > 0;

const ResponseOptionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

const ResponseFieldShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
});

function ResponseStyleSection({
  title,
  message,
  headingId,
  descriptionId,
  state,
  copy,
  onRetry,
  onFieldChange,
  onFieldCommit,
}) {
  const fallbackDescriptionId = useId();
  const hasMessage = isMeaningful(message);
  const resolvedDescriptionId = hasMessage
    ? descriptionId ?? fallbackDescriptionId
    : undefined;

  const status = state?.status ?? "idle";
  const values = state?.values ?? {};
  const persisted = state?.persisted ?? {};
  const savingField = state?.savingField ?? null;
  const error = state?.error ?? null;
  const hasLoadedValues = Object.keys(values).length > 0;
  const isLoading = status === "idle" || status === "loading";
  const shouldShowPlaceholder = isLoading && !hasLoadedValues;
  const shouldShowError = Boolean(error);

  const handleChange = (fieldId) => (event) => {
    if (typeof onFieldChange === "function") {
      onFieldChange(fieldId, event?.target?.value ?? "");
    }
  };

  const handleBlur = (fieldId) => () => {
    if (typeof onFieldCommit === "function") {
      onFieldCommit(fieldId);
    }
  };

  const renderFieldAction = (fieldId) => {
    if (status === "saving" && savingField === fieldId) {
      return <span className={styles.placeholder}>{copy.savingLabel}</span>;
    }

    const nextValue = (values[fieldId] ?? "").trim();
    const persistedValue = (persisted[fieldId] ?? "").trim();
    if (status === "ready" && nextValue === persistedValue) {
      return <span className={styles.placeholder}>{copy.savedLabel}</span>;
    }

    return null;
  };

  const renderErrorRow = () => (
    <div role="alert" className={styles["detail-row"]}>
      <p className={styles.placeholder}>{copy.errorLabel}</p>
      <div />
      <div className={styles["detail-action"]}>
        {typeof onRetry === "function" ? (
          <button
            type="button"
            className={composeClassName(
              styles["avatar-trigger"],
              styles["detail-action-button"],
            )}
            onClick={() => onRetry()}
          >
            {copy.retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={resolvedDescriptionId}
      className={composeClassName(styles.section, styles["section-plain"])}
    >
      <div className={styles["section-header"]}>
        <h3 id={headingId} className={styles["section-title"]} tabIndex={-1}>
          {title}
        </h3>
        <div className={styles["section-divider"]} aria-hidden="true" />
      </div>
      {hasMessage ? (
        <p id={resolvedDescriptionId} className={styles["section-description"]}>
          {message}
        </p>
      ) : null}
      <div aria-live="polite" className={styles.details}>
        {shouldShowPlaceholder ? (
          <p className={styles.placeholder}>{copy.loadingLabel}</p>
        ) : null}
        {shouldShowError ? renderErrorRow() : null}
        {hasLoadedValues ? (
          <dl className={styles.details}>
            <div className={styles["detail-row"]}>
              <dt className={styles["detail-label"]}>
                <label htmlFor="response-style-select">{copy.dropdownLabel}</label>
              </dt>
              <dd className={styles["detail-value"]}>
                <select
                  id="response-style-select"
                  value={values.responseStyle ?? ""}
                  onChange={handleChange("responseStyle")}
                  onBlur={handleBlur("responseStyle")}
                >
                  {(copy.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {isMeaningful(option.description)
                        ? `${option.label} — ${option.description}`
                        : option.label}
                    </option>
                  ))}
                </select>
              </dd>
              <div className={styles["detail-action"]} aria-live="polite">
                {renderFieldAction("responseStyle")}
              </div>
            </div>
            {(copy.fields ?? []).map((field) => (
              <div key={field.id} className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>
                  <label htmlFor={`${field.id}-input`}>{field.label}</label>
                </dt>
                <dd className={styles["detail-value"]}>
                  <input
                    id={`${field.id}-input`}
                    type="text"
                    value={values[field.id] ?? ""}
                    onChange={handleChange(field.id)}
                    onBlur={handleBlur(field.id)}
                    placeholder={field.placeholder}
                  />
                </dd>
                <div className={styles["detail-action"]} aria-live="polite">
                  {renderFieldAction(field.id)}
                </div>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

ResponseStyleSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  state: PropTypes.shape({
    status: PropTypes.string.isRequired,
    values: PropTypes.object.isRequired,
    persisted: PropTypes.object.isRequired,
    savingField: PropTypes.string,
    error: PropTypes.any,
  }).isRequired,
  copy: PropTypes.shape({
    loadingLabel: PropTypes.string.isRequired,
    savingLabel: PropTypes.string.isRequired,
    savedLabel: PropTypes.string.isRequired,
    errorLabel: PropTypes.string.isRequired,
    retryLabel: PropTypes.string.isRequired,
    dropdownLabel: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(ResponseOptionShape).isRequired,
    fields: PropTypes.arrayOf(ResponseFieldShape).isRequired,
  }).isRequired,
  onRetry: PropTypes.func,
  onFieldChange: PropTypes.func,
  onFieldCommit: PropTypes.func,
};

ResponseStyleSection.defaultProps = {
  message: "",
  descriptionId: undefined,
  onRetry: undefined,
  onFieldChange: undefined,
  onFieldCommit: undefined,
};

export default ResponseStyleSection;
