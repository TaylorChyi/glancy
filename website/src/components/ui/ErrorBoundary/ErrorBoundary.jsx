import React, { Component } from "react";
import PropTypes from "prop-types";
import styles from "./ErrorBoundary.module.css";

function areResetKeysEqual(prevKeys = [], nextKeys = []) {
  if (prevKeys === nextKeys) return true;
  if (!Array.isArray(prevKeys) || !Array.isArray(nextKeys)) {
    return false;
  }
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  return prevKeys.every((key, index) => Object.is(key, nextKeys[index]));
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const { onError } = this.props;
    console.error("ErrorBoundary caught an error", error, info);
    if (onError) {
      onError(error, info);
    }
  }

  componentDidUpdate(prevProps) {
    const { resetKeys } = this.props;
    if (
      this.state.hasError &&
      !areResetKeysEqual(prevProps.resetKeys, resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary() {
    if (!this.state.hasError) return;
    this.setState({ hasError: false });
    const { onReset } = this.props;
    if (onReset) {
      onReset();
    }
  }

  render() {
    const { hasError } = this.state;
    const { fallback, children } = this.props;
    if (hasError) {
      return (
        <div className={styles["error-boundary"]}>
          {fallback || "Something went wrong."}
        </div>
      );
    }
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  resetKeys: PropTypes.arrayOf(PropTypes.any),
  onReset: PropTypes.func,
  onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  resetKeys: undefined,
  onReset: undefined,
  onError: undefined,
};

export default ErrorBoundary;
