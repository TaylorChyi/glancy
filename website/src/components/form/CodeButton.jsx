import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context";
import styles from "./AuthForm.module.css";

// button with configurable countdown triggered after click

const DEFAULT_IDLE_LABEL = "Get code";
const COUNT_PLACEHOLDER = "{count}";
const DEFAULT_COUNTDOWN_TEMPLATE = "{count}s";

const isLetterOrIdeograph = (char) => {
  if (!char) return false;
  const codePoint = char.codePointAt(0);
  if (codePoint == null) {
    return false;
  }
  const isAsciiLetter =
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a);
  const isCjkUnifiedIdeograph = codePoint >= 0x4e00 && codePoint <= 0x9fff;
  return isAsciiLetter || isCjkUnifiedIdeograph;
};

const formatCountdownLabel = (template, value) => {
  const normalizedTemplate =
    typeof template === "string" && template.length > 0
      ? template
      : DEFAULT_COUNTDOWN_TEMPLATE;

  if (!normalizedTemplate.includes(COUNT_PLACEHOLDER)) {
    return normalizedTemplate;
  }

  const [leading, ...rest] = normalizedTemplate.split(COUNT_PLACEHOLDER);
  const trailing = rest.join(COUNT_PLACEHOLDER);

  const trimmedTrailing = trailing.trimStart();
  const [firstTrailingChar] = trimmedTrailing
    ? Array.from(trimmedTrailing)
    : [];
  const needsTrailingSpace =
    trailing.length > 0 &&
    !trailing.startsWith(" ") &&
    Boolean(firstTrailingChar) &&
    isLetterOrIdeograph(firstTrailingChar);

  const normalizedTrailing = needsTrailingSpace ? ` ${trailing}` : trailing;

  return `${leading}${value}${normalizedTrailing}`;
};

function CodeButton({ onClick, countdownDuration = 60 }) {
  const [count, setCount] = useState(0);
  const { t } = useLanguage();

  const buttonIdleLabel = t.codeButtonLabel ?? DEFAULT_IDLE_LABEL;
  const countdownTemplate =
    typeof t.codeButtonCountdown === "string" &&
    t.codeButtonCountdown.length > 0
      ? t.codeButtonCountdown
      : DEFAULT_COUNTDOWN_TEMPLATE;
  const countdownLabel = useMemo(
    () => formatCountdownLabel(countdownTemplate, count),
    [countdownTemplate, count],
  );

  useEffect(() => {
    if (count === 0) return undefined;
    const id = setInterval(() => {
      setCount((c) => c - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [count]);

  const handleClick = () => {
    if (onClick) onClick();
    setCount(countdownDuration);
  };

  return (
    <button
      type="button"
      className={styles["code-btn"]}
      disabled={count > 0}
      onClick={handleClick}
    >
      {count > 0 ? countdownLabel : buttonIdleLabel}
    </button>
  );
}

export default CodeButton;
