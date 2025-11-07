import { useCallback, useEffect, useState } from "react";

const toTimestamp = (seconds) => Date.now() + seconds * 1000;

const computeRemainingSeconds = (targetTimestamp) => {
  const diff = targetTimestamp - Date.now();
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / 1000);
};

export default function useCountdownTimer(durationSeconds) {
  const [targetTimestamp, setTargetTimestamp] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const reset = useCallback(() => {
    setTargetTimestamp(null);
    setRemainingSeconds(0);
  }, []);

  const start = useCallback(() => {
    setTargetTimestamp(toTimestamp(durationSeconds));
  }, [durationSeconds]);

  useEffect(() => {
    if (!targetTimestamp) {
      setRemainingSeconds(0);
      return undefined;
    }

    const tick = () => {
      const nextRemaining = computeRemainingSeconds(targetTimestamp);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining === 0) {
        setTargetTimestamp(null);
      }
    };

    tick();
    const timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [targetTimestamp]);

  return { remainingSeconds, start, reset };
}
