import { useFrameController } from "./useFrameController";
import { useApplyPopoverPosition } from "./useApplyPopoverPosition";
import {
  useGlobalDismissHandlers,
  usePlacementReset,
  usePositioningCycle,
} from "./usePopoverLifecycle";
import { usePopoverCoreState } from "./usePopoverState";
import { usePopoverPositionUpdater } from "./usePopoverPositionUpdater";

export default function usePopoverPositioning({
  anchorRef,
  isOpen,
  placement,
  fallbackPlacements,
  align,
  offset,
  onClose,
}) {
  const {
    contentRef,
    frameRef,
    position,
    setPosition,
    visible,
    setVisible,
    activePlacement,
    setActivePlacement,
    setContentNode,
  } = usePopoverCoreState(placement);

  const resolvePosition = usePopoverPositionUpdater({
    anchorRef,
    contentRef,
    placement,
    fallbackPlacements,
    align,
    offset,
  });

  const applyPosition = useApplyPopoverPosition({
    isOpen,
    resolvePosition,
    setPosition,
    setActivePlacement,
    setVisible,
  });

  const { clearFrame, scheduleUpdate } = useFrameController({
    frameRef,
    isOpen,
    applyPosition,
  });

  usePositioningCycle({ isOpen, scheduleUpdate, clearFrame });
  useGlobalDismissHandlers({
    isOpen,
    anchorRef,
    contentRef,
    onClose,
    scheduleUpdate,
    setVisible,
  });

  usePlacementReset({
    isOpen,
    placement,
    setVisible,
    setActivePlacement,
  });

  return {
    setContentNode,
    position,
    visible,
    activePlacement,
  };
}
