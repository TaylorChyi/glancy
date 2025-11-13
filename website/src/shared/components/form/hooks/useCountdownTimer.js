import { useCallback, useEffect, useState } from "react";

const calculateRemainingSeconds = (deadline) =>
  Math.ceil((deadline - Date.now()) / 1000);

const resetCountdown = ({ setDeadline, setCount }) => {
  setDeadline(null);
  setCount(0);
};

const tickCountdown = ({ deadline, setDeadline, setCount }) => {
  const remaining = calculateRemainingSeconds(deadline);
  if (remaining <= 0) {
    resetCountdown({ setDeadline, setCount });
    return;
  }
  setCount(remaining);
};

const useCountdownEffect = ({ deadline, setDeadline, setCount }) => {
  useEffect(() => {
    if (!deadline) {
      setCount(0);
      return undefined;
    }

    const update = () => tickCountdown({ deadline, setDeadline, setCount });
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline, setCount, setDeadline]);
};

const useCountdownStarter = ({ duration, setDeadline, setCount }) =>
  useCallback(() => {
    if (duration <= 0) {
      return;
    }
    const nextDeadline = Date.now() + duration * 1000;
    setCount(duration);
    setDeadline(nextDeadline);
  }, [duration, setCount, setDeadline]);

const useCountdownTimer = (duration) => {
  const [deadline, setDeadline] = useState(null);
  const [count, setCount] = useState(0);

  useCountdownEffect({ deadline, setDeadline, setCount });
  const start = useCountdownStarter({ duration, setDeadline, setCount });

  return { count, isCountingDown: Boolean(deadline), start };
};

export default useCountdownTimer;
