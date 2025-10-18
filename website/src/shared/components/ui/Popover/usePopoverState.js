/**
 * 背景：
 *  - Popover 需要管理内容节点、动画帧与可见性等多类状态，若直接散落在组件内会增加耦合度。
 * 目的：
 *  - 提供集中化的状态 Hook，便于定位扩展点并减小主 Hook 体量。
 * 关键决策与取舍：
 *  - 仅暴露必要的 setter，避免调用方直接操作 ref；
 *  - 通过 useRef 保存 DOM 节点引用，保持 React 渲染与 DOM 操作的隔离。
 * 影响范围：
 *  - usePopoverPositioning 依赖该 Hook 获取核心状态。
 * 演进与TODO：
 *  - 后续可在此扩展可见性动画或无障碍属性的集中管理。
 */
import { useCallback, useRef, useState } from "react";

export function usePopoverCoreState(initialPlacement) {
  const contentRef = useRef(null);
  const frameRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [activePlacement, setActivePlacement] = useState(initialPlacement);

  const setContentNode = useCallback((node) => {
    contentRef.current = node;
  }, []);

  return {
    contentRef,
    frameRef,
    position,
    setPosition,
    visible,
    setVisible,
    activePlacement,
    setActivePlacement,
    setContentNode,
  };
}
