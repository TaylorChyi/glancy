import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "@core/context";
import useCountdownTimer from "./useCountdownTimer.js";

const COUNT_PLACEHOLDER = "{count}";
const DEFAULT_IDLE_LABEL = "Get code";
const DEFAULT_COUNTDOWN_TEMPLATE = `${COUNT_PLACEHOLDER} s`;

const normalizeCountdownLabel = (label) =>
  label
    .replace(/(\d)([^\d\s])/gu, "$1 $2")
    .replace(/([^\d\s])(\d)/gu, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();

const useNormalizedDuration = (duration) =>
  useMemo(() => {
    const parsed = Number(duration);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed);
  }, [duration]);

const useButtonLabels = ({ label, template, count }) => {
  const idleLabel = label ?? DEFAULT_IDLE_LABEL;
  const countdownTemplate = template ?? DEFAULT_COUNTDOWN_TEMPLATE;

  const countdownLabel = useMemo(() => {
    const rawLabel = countdownTemplate.replace(
      COUNT_PLACEHOLDER,
      String(count),
    );
    return normalizeCountdownLabel(rawLabel);
  }, [count, countdownTemplate]);

  return { idleLabel, countdownLabel };
};

const useAsyncAction = (action) => {
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async () => {
    if (isRunning || typeof action !== "function") {
      return false;
    }

    let shouldProceed = true;

    try {
      setIsRunning(true);
      const result = await action();
      if (result === false) {
        shouldProceed = false;
      }
    } catch (error) {
      console.error(error);
      shouldProceed = false;
    } finally {
      setIsRunning(false);
    }

    return shouldProceed;
  }, [action, isRunning]);

  return { isRunning, run };
};

const useCodeButtonState = ({ countdownDuration, onClick }) => {
  const { t } = useLanguage();
  const normalizedDuration = useNormalizedDuration(countdownDuration);
  const { count, isCountingDown, start } = useCountdownTimer(normalizedDuration);
  const { idleLabel, countdownLabel } = useButtonLabels({
    label: t.codeButtonLabel,
    template: t.codeButtonCountdown,
    count,
  });
  const { isRunning, run } = useAsyncAction(onClick);

  const handleClick = useCallback(async () => {
    const shouldStart = await run();
    if (shouldStart && normalizedDuration > 0) {
      start();
    }
  }, [normalizedDuration, run, start]);

  return {
    handleClick,
    isCountingDown,
    isRequesting: isRunning,
    idleLabel,
    countdownLabel,
  };
};

export default useCodeButtonState;
