/**
 * 背景：
 *  - 等待动画从序列帧轮播升级为“随机抽帧 + 填充”状态，需要有状态地控制素材切换时机。
 * 目的：
 *  - 封装成 Hook，集中处理素材池、随机策略与 React 生命周期，避免在 Loader 组件中散落副作用。
 * 关键决策与取舍：
 *  - 采用状态模式思路：Hook 内部维护当前帧索引与响应动画迭代事件的转换函数，保持组件层纯展示。
 *  - 提供可注入的随机函数，便于单测时复现确定性场景，同时保证默认实现零依赖。
 *  - 2025-02：补充调度策略注入口（scheduler/cancel/autoStart），让 Hook 自行掌控节奏，Loader 不再关心定时细节。
 *  - 2025-03：新增 shouldSchedule 开关，以便在单帧模式下跳过调度，避免无意义的动画重置。
 * 影响范围：
 *  - Loader 组件通过该 Hook 接收当前帧与迭代回调；未来若引入更多素材池或节奏策略，可在 Hook 内扩展。
 * 演进与TODO：
 *  - TODO：支持基于用户偏好/主题的素材分组与加权随机，提供更贴合语境的等待体验。
 */
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
  const randomRef = useRef(options.random ?? Math.random);
  const randomFn = randomRef.current;
  const schedulerRef = useRef(options.scheduler ?? setTimeout);
  const cancelRef = useRef(options.cancel ?? clearTimeout);
  const autoStart = options.autoStart ?? true;
  const shouldSchedule = options.shouldSchedule ?? framePool.length > 1;
  const allowScheduling = autoStart && shouldSchedule && framePool.length > 1;

  const [state, setState] = useState(() =>
    createInitialState(framePool, randomFn),
  );

  const handleCycleComplete = useCallback(() => {
    if (framePool.length <= 1) {
      return;
    }
    setState((previous) =>
      deriveNextState(framePool, randomFn, previous.frameIndex),
    );
  }, [framePool, randomFn]);

  useEffect(() => {
    if (!allowScheduling) {
      return undefined;
    }
    const scheduler = schedulerRef.current;
    const cancel = cancelRef.current;
    const timerId = scheduler(() => {
      setState((previous) =>
        deriveNextState(framePool, randomFn, previous.frameIndex),
      );
    }, WAITING_CYCLE_INTERVAL_MS);
    return () => cancel(timerId);
  }, [allowScheduling, framePool, randomFn, state.frameIndex]);

  return useMemo(
    () => ({
      currentFrame: state.frameSrc,
      handleCycleComplete,
      cycleDurationMs: WAITING_CYCLE_INTERVAL_MS,
    }),
    [handleCycleComplete, state.frameSrc],
  );
}
