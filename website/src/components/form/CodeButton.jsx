import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context";
import styles from "./AuthForm.module.css";

// button with configurable countdown triggered after click

const DEFAULT_IDLE_LABEL = "Get code";
const DEFAULT_COUNTDOWN_TEMPLATE = "{count}s";

function CodeButton({ onClick, countdownDuration = 60 }) {
  const [count, setCount] = useState(0);
  const { t } = useLanguage();

  const buttonIdleLabel = t.codeButtonLabel ?? DEFAULT_IDLE_LABEL;
  const countdownTemplate = t.codeButtonCountdown ?? DEFAULT_COUNTDOWN_TEMPLATE;
  const countdownLabel = useMemo(
    () => countdownTemplate.replace("{count}", count),
    [count, countdownTemplate],
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
