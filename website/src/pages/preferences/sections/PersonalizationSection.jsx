/**
 * 背景：
 *  - 偏好设置的个性化分区此前仅渲染占位提示，用户无法在设置页回顾画像详情。
 * 目的：
 *  - 通过“适配器 + 只读视图模型”呈现个性化画像摘要，保持与 Profile 页面一致的字段语义。
 * 关键决策与取舍：
 *  - 组件保持无状态，只依赖外部注入的快照与文案，便于未来切换到可编辑模式；
 *  - 放弃在组件内请求数据，改由 usePreferenceSections 汇聚，确保视图层专注展示。
 * 影响范围：
 *  - Preferences/SettingsModal 内的 "Personalization" 分区内容。
 * 演进与TODO：
 *  - TODO: 接入编辑能力时，可在 snapshot 中扩展交互元数据并于此渲染编辑控件。
 */
import { useId, useMemo } from "react";
import PropTypes from "prop-types";
import styles from "../Preferences.module.css";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

const formatCustomItemDisplay = (item) => {
  const hasLabel = item.label && item.label.trim().length > 0;
  const hasValue = item.value && item.value.trim().length > 0;
  if (hasLabel && hasValue) {
    return `${item.label} — ${item.value}`;
  }
  if (hasLabel) {
    return item.label;
  }
  if (hasValue) {
    return item.value;
  }
  return "";
};

function PersonalizationSection({
  title,
  message,
  headingId,
  descriptionId,
  state,
  copy,
  onRetry,
}) {
  const fallbackDescriptionId = useId();
  const hasMessage = typeof message === "string" && message.trim().length > 0;
  const resolvedDescriptionId = hasMessage
    ? descriptionId ?? fallbackDescriptionId
    : undefined;

  const snapshot = state?.snapshot;
  const status = state?.status ?? "idle";
  const isLoading = status === "idle" || status === "loading";
  const isError = status === "error";

  const hasDetails = Boolean(snapshot?.hasDetails);

  const customSections = useMemo(() => {
    if (!snapshot?.customSections) {
      return [];
    }
    return snapshot.customSections.map((section) => ({
      id: section.id,
      title: section.title,
      items: section.items
        .map((item) => ({
          ...item,
          display: formatCustomItemDisplay(item),
        }))
        .filter((item) => item.display.trim().length > 0),
    }));
  }, [snapshot?.customSections]);

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
        <p
          id={resolvedDescriptionId}
          className={styles["section-description"]}
        >
          {message}
        </p>
      ) : null}
      <div aria-live="polite" className={styles.details}>
        {isLoading ? (
          <p className={styles.placeholder}>{copy.loadingLabel}</p>
        ) : null}
        {isError ? (
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
        ) : null}
        {!isLoading && !isError && hasDetails ? (
          <>
            {snapshot.summary ? (
              <div className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>{copy.summaryLabel}</dt>
                <dd className={styles["detail-value"]}>{snapshot.summary}</dd>
                <div className={styles["detail-action"]} />
              </div>
            ) : null}
            {snapshot.fields.map((field) => (
              <div key={field.id} className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>{field.label}</dt>
                <dd className={styles["detail-value"]}>{field.value}</dd>
                <div className={styles["detail-action"]} />
              </div>
            ))}
            {customSections.map((section) => (
              <div key={section.id} className={styles["detail-row"]}>
                <dt className={styles["detail-label"]}>{section.title}</dt>
                <dd className={styles["detail-value"]}>
                  {section.items.length === 0
                    ? copy.emptyLabel
                    : section.items.map((item) => (
                        <div key={item.id}>{item.display}</div>
                      ))}
                </dd>
                <div className={styles["detail-action"]} />
              </div>
            ))}
          </>
        ) : null}
        {!isLoading && !isError && !hasDetails ? (
          <p className={styles.placeholder}>{copy.emptyLabel}</p>
        ) : null}
      </div>
    </section>
  );
}

PersonalizationSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  state: PropTypes.shape({
    status: PropTypes.string.isRequired,
    snapshot: PropTypes.shape({
      summary: PropTypes.string,
      hasDetails: PropTypes.bool,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ),
      customSections: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
          items: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.string.isRequired,
              label: PropTypes.string,
              value: PropTypes.string,
            }),
          ),
        }),
      ),
    }).isRequired,
    error: PropTypes.any,
  }).isRequired,
  copy: PropTypes.shape({
    loadingLabel: PropTypes.string.isRequired,
    errorLabel: PropTypes.string.isRequired,
    retryLabel: PropTypes.string.isRequired,
    emptyLabel: PropTypes.string.isRequired,
    summaryLabel: PropTypes.string.isRequired,
  }).isRequired,
  onRetry: PropTypes.func,
};

PersonalizationSection.defaultProps = {
  descriptionId: undefined,
  onRetry: undefined,
};

export default PersonalizationSection;
