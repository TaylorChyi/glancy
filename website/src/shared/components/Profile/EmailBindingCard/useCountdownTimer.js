/**
 * 背景：
 *  - 邮箱验证码发送流程需要倒计时，但旧实现直接散落在组件中，缺乏复用能力。
 * 目的：
 *  - 抽象出独立的倒计时 Hook，供邮箱绑定等场景共享，避免组件体量膨胀。
 * 关键决策与取舍：
 *  - 采用原生 setInterval，结合 Math.ceil 保证剩余秒数语义明确；
 *  - 暴露 start/reset 接口，便于控制器在不同状态下重置定时器。
 * 影响范围：
 *  - 依赖验证码倒计时的组件逻辑；
 *  - 未来如需多倒计时实例，可扩展为接受唯一 key 的 Map。
 * 演进与TODO：
 *  - 后续可支持暂停/继续与自定义 tick 间隔，以满足更复杂的交互需求。
 */
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
