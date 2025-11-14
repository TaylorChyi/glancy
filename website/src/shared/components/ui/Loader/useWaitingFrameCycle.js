import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";

const { frameIntervalMs: WAITING_CYCLE_INTERVAL_MS } = waitingAnimationStrategy;

function assertValidFrames(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new TypeError("frames 至少需要包含一项可用资源");
  }
}

function clampIndex(candidateIndex, poolSize) {
  if (candidateIndex < 0) {
    return 0;
  }
  if (candidateIndex >= poolSize) {
    return poolSize - 1;
  }
  return candidateIndex;
}

function selectNextIndex(poolSize, randomFn, previousIndex) {
  if (poolSize === 1) {
    return 0;
  }
  const raw = randomFn();
  const candidateIndex = clampIndex(Math.floor(raw * poolSize), poolSize);
  if (candidateIndex !== previousIndex) {
    return candidateIndex;
  }
  return (candidateIndex + 1) % poolSize;
}

function createInitialState(frames, randomFn) {
  const initialIndex = selectNextIndex(frames.length, randomFn, -1);
  return {
    frameIndex: initialIndex,
    frameSrc: frames[initialIndex],
  };
}

function deriveNextState(frames, randomFn, previousIndex) {
  const nextIndex = selectNextIndex(frames.length, randomFn, previousIndex);
  return {
    frameIndex: nextIndex,
    frameSrc: frames[nextIndex],
  };
}

export default function useWaitingFrameCycle(frames, options = {}) {
  assertValidFrames(frames);
  const framePool = useMemo(() => frames.slice(), [frames]);
  const randomFn = useRef(options.random ?? Math.random).current;
  const schedulerRef = useRef(options.scheduler ?? setTimeout);
  const cancelRef = useRef(options.cancel ?? clearTimeout);
  const autoStart = options.autoStart ?? true;
  const shouldSchedule = options.shouldSchedule ?? framePool.length > 1;
  const allowScheduling = autoStart && shouldSchedule && framePool.length > 1;
  const [state, setState] = useState(() => createInitialState(framePool, randomFn));
  const advanceFrame = useCallback(() => {
    if (framePool.length <= 1) return;
    setState((previous) =>
      deriveNextState(framePool, randomFn, previous.frameIndex),
    );
  }, [framePool, randomFn]);
  useEffect(() => {
    if (!allowScheduling) return undefined;
    const timerId = schedulerRef.current(() => advanceFrame(), WAITING_CYCLE_INTERVAL_MS);
    const cancel = cancelRef.current;
    return () => cancel(timerId);
  }, [allowScheduling, advanceFrame]);
  return useMemo(
    () => ({
      currentFrame: state.frameSrc,
      handleCycleComplete: advanceFrame,
      cycleDurationMs: WAITING_CYCLE_INTERVAL_MS,
    }),
    [advanceFrame, state.frameSrc],
  );
}
