/**
 * 背景：
 *  - 指针捕获与重置副作用散布在控制器中，增加函数行数与耦合度。
 * 目的：
 *  - 封装 pointer handlers，并在内部处理 open/source 变化时的状态重置。
 * 关键决策与取舍：
 *  - 复用 usePointerDrag 提供的指针行为；
 *  - 统一在此 hook 中处理 effect，避免控制器重复书写依赖列表。
 * 影响范围：
 *  - AvatarEditorModal 控制器。
 * 演进与TODO：
 *  - 可扩展键盘或触控板手势时在此集中处理。
 */

import { useEffect } from "react";
import usePointerDrag from "./usePointerDrag.js";

const usePointerControls = ({ open, source, containerRef, onOffsetChange }) => {
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  } = usePointerDrag({ containerRef, onOffsetChange });

  useEffect(() => {
    resetPointerTracking();
  }, [open, source, resetPointerTracking]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPointerTracking,
  };
};

export default usePointerControls;
