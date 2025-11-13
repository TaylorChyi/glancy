import PropTypes from "prop-types";
import styles from "../../Preferences.module.css";
import { composeClassName } from "./composeClassName.js";
import {
  placeholderPropType,
  errorPropType,
} from "./responseStylePropTypes.js";

const RetryButton = ({ onRetry, label }) => (
  <button
    type="button"
    className={composeClassName(
      styles["avatar-trigger"],
      styles["detail-action-button"],
    )}
    onClick={onRetry}
  >
    {label}
  </button>
);

RetryButton.propTypes = {
  onRetry: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export const PlaceholderMessage = ({ placeholder }) =>
  placeholder.visible ? (
    <p className={styles.placeholder}>{placeholder.label}</p>
  ) : null;

PlaceholderMessage.propTypes = {
  placeholder: placeholderPropType.isRequired,
};

export const ErrorMessage = ({ error }) =>
  error.visible ? (
    <div role="alert" className={styles["detail-row"]}>
      <p className={styles.placeholder}>{error.label}</p>
      <div />
      <div className={styles["detail-action"]}>
        {error.onRetry ? (
          <RetryButton onRetry={error.onRetry} label={error.retryLabel} />
        ) : null}
      </div>
    </div>
  ) : null;

ErrorMessage.propTypes = {
  error: errorPropType.isRequired,
};

