/**
 * 背景：
 *  - 等待动画从单帧遮罩升级为 3D 波浪圆环，需要在原有策略模式基础上扩展到多环、多字符动态。
 * 目的：
 *  - 以策略对象集中描述波浪参数与环形配置，Loader 仅负责装配结构与动画调度。
 * 关键决策与取舍：
 *  - 沿用策略模式（waitingAnimationStrategy）输出多环蓝图，确保换素材时不必修改组件骨架；
 *  - 通过 requestAnimationFrame 承载整体旋转，避免 CSS 无限动画导致的可达性问题，并可在后续按需引入降速策略；
 *  - 采用 `useMemo` 固定环上字符与姿态，保证渲染纯粹、易于测试与调试。
 * 影响范围：
 *  - Loader 组件视觉结构、等待动画策略与对应测试；对外 API 未变，仍输出 aria 语义。
 * 演进与TODO：
 *  - TODO：引入基于 prefers-reduced-motion 的节奏降级与主题化字符集切换。
 */
import { useEffect, useMemo, useRef } from "react";
import styles from "./Loader.module.css";
import waitingAnimationStrategy from "./waitingAnimationStrategy.cjs";

const WAITING_ANIMATION_STRATEGY = waitingAnimationStrategy;
const ROTATION_SPEED_DEG_PER_SEC =
  WAITING_ANIMATION_STRATEGY.rotationSpeedDegPerSec;

function scheduleRingRotation(ringRefs, ringBlueprints) {
  if (typeof window === "undefined" || ringBlueprints.length === 0) {
    return () => {};
  }

  const rotationState = ringBlueprints.map((ring) => ring.startRotation % 360);
  let animationFrameId;
  let previousTimestamp;
  const speedPerMs = ROTATION_SPEED_DEG_PER_SEC / 1000;

  const step = (timestamp) => {
    if (previousTimestamp === undefined) {
      previousTimestamp = timestamp;
    }
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
    const rotationDelta = delta * speedPerMs;

    ringRefs.current.forEach((ringEl, index) => {
      if (!ringEl) {
        return;
      }
      rotationState[index] =
        (rotationState[index] + rotationDelta + 360) % 360;
      ringEl.style.transform = `rotateY(${rotationState[index]}deg)`;
    });

    animationFrameId = window.requestAnimationFrame(step);
  };

  animationFrameId = window.requestAnimationFrame(step);

  return () => {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }
  };
}

function Loader() {
  const ringBlueprints = useMemo(() => {
    return WAITING_ANIMATION_STRATEGY.buildRings();
  }, []);

  const ringRefs = useRef([]);

  useEffect(() => {
    ringRefs.current = ringRefs.current.slice(0, ringBlueprints.length);
    return scheduleRingRotation(ringRefs, ringBlueprints);
  }, [ringBlueprints]);

  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.stack}>
          {ringBlueprints.map((ring, ringIndex) => (
            <div
              key={ring.id}
              className={styles.ring}
              style={{
                fontWeight: ring.fontWeight,
                transform: `rotateY(${ring.startRotation}deg)`,
              }}
              ref={(node) => {
                ringRefs.current[ringIndex] = node;
              }}
            >
              {ring.glyphs.map((glyph) => (
                <span
                  key={glyph.id}
                  className={styles.glyph}
                  style={{ transform: glyph.transform }}
                >
                  {glyph.char}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className={styles.label}>Loading…</span>
    </div>
  );
}

export default Loader;
