import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@core/context";
import styles from "./styles/index.js";

// button with configurable countdown triggered after click

const COUNT_PLACEHOLDER = "{count}";
const DEFAULT_IDLE_LABEL = "Get code";
const DEFAULT_COUNTDOWN_TEMPLATE = `${COUNT_PLACEHOLDER} s`;

const normalizeCountdownLabel = (label) =>
  label
    .replace(/(\d)([^\d\s])/gu, "$1 $2")
    .replace(/([^\d\s])(\d)/gu, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();

function CodeButton({ onClick, countdownDuration = 60 }) {
  const [count, setCount] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
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
  const countdownLabel = useMemo(() => {
    const rawLabel = countdownTemplate.replace(
      COUNT_PLACEHOLDER,
      String(count),
    );
    return normalizeCountdownLabel(rawLabel);
  }, [count, countdownTemplate]);

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

  const handleClick = async () => {
    if (isRequesting) {
      return;
    }

    if (typeof onClick !== "function") {
      return;
    }

    let shouldStartCountdown = true;

    try {
      setIsRequesting(true);
      const result = await onClick();
      if (result === false) {
        shouldStartCountdown = false;
      }
    } catch (error) {
      console.error(error);
      shouldStartCountdown = false;
    } finally {
      setIsRequesting(false);
    }

    if (!shouldStartCountdown || normalizedDuration <= 0) {
      return;
    }

    const target = Date.now() + normalizedDuration * 1000;
    setCount(normalizedDuration);
    setDeadline(target);
  };

  return (
    <button
      type="button"
      className={styles["code-btn"]}
      disabled={isCountingDown || isRequesting}
      aria-busy={isRequesting}
      onClick={handleClick}
    >
      {isCountingDown ? countdownLabel : buttonIdleLabel}
    </button>
  );
}

export default CodeButton;
