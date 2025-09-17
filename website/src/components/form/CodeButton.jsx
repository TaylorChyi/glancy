import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context";
import styles from "./AuthForm.module.css";

// button with configurable countdown triggered after click

const DEFAULT_IDLE_LABEL = "Get code";
const DEFAULT_COUNTDOWN_TEMPLATE = "{count}s";

function CodeButton({ onClick, countdownDuration = 60 }) {
  const [count, setCount] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const { t } = useLanguage();

  const buttonIdleLabel = t.codeButtonLabel ?? DEFAULT_IDLE_LABEL;
  const normalizedDuration = useMemo(() => {
    const parsed = Number(countdownDuration);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed);
  }, [countdownDuration]);

  const isCountingDown = Boolean(deadline);

  const countdownTemplate = t.codeButtonCountdown ?? DEFAULT_COUNTDOWN_TEMPLATE;
  const countdownLabel = useMemo(
    () => countdownTemplate.replace("{count}", count),
    [count, countdownTemplate],
  );

  useEffect(() => {
    if (!deadline) {
      setCount(0);
      return undefined;
    }

    const updateRemaining = () => {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        setCount(0);
        setDeadline(null);
        return;
      }
      setCount(Math.ceil(remainingMs / 1000));
    };

    updateRemaining();
    const id = setInterval(updateRemaining, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const handleClick = () => {
    if (typeof onClick === "function") {
      onClick();
    }
    if (normalizedDuration > 0) {
      const target = Date.now() + normalizedDuration * 1000;
      setCount(normalizedDuration);
      setDeadline(target);
    }
  };

  return (
    <button
      type="button"
      className={styles["code-btn"]}
      disabled={isCountingDown}
      onClick={handleClick}
    >
      {isCountingDown ? countdownLabel : buttonIdleLabel}
    </button>
  );
}

export default CodeButton;
