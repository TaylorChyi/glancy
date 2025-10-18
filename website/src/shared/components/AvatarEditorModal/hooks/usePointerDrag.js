/**
 * 背景：
 *  - 指针拖拽行为原本散落在组件中，与视口状态耦合，使得复用与测试困难。
 * 目的：
 *  - 将指针捕获与位移计算封装成独立 hook，供控制器层组合。
 * 关键决策与取舍：
 *  - 仅依赖回调对外暴露偏移增量，维持与视口模型的解耦；
 *  - 保持 HTML Pointer Events 语义，方便未来在触控设备上复用。
 * 影响范围：
 *  - AvatarEditorModal 控制器；
 * 演进与TODO：
 *  - 若后续支持键盘/触控板，应在此扩展统一输入策略。
 */

import { useCallback, useRef } from "react";

const INITIAL_POINT = { x: 0, y: 0 };

const usePointerDrag = ({ containerRef, onOffsetChange }) => {
  const pointerIdRef = useRef(null);
  const lastPointRef = useRef(INITIAL_POINT);

  const resetPointerTracking = useCallback(() => {
    pointerIdRef.current = null;
    lastPointRef.current = INITIAL_POINT;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      if (!containerRef.current) return;
      event.preventDefault();
      containerRef.current.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
    },
    [containerRef],
  );

  const handlePointerMove = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) return;
      const deltaX = event.clientX - lastPointRef.current.x;
      const deltaY = event.clientY - lastPointRef.current.y;
      if (deltaX === 0 && deltaY === 0) return;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      onOffsetChange(deltaX, deltaY);
    },
    [onOffsetChange],
  );

  const handlePointerUp = useCallback(
    (event) => {
      if (pointerIdRef.current !== event.pointerId) return;
      pointerIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(event.pointerId);
      }
    },
    [containerRef],
  );

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  };
};

export default usePointerDrag;
