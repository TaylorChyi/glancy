import { useFrameController } from "./useFrameController";
import { useApplyPopoverPosition } from "./useApplyPopoverPosition";
import {
  useGlobalDismissHandlers,
  usePlacementReset,
  usePositioningCycle,
} from "./usePopoverLifecycle";
import { usePopoverCoreState } from "./usePopoverState";
import { usePopoverPositionUpdater } from "./usePopoverPositionUpdater";

export default function usePopoverPositioning(props) {
  const { anchorRef, isOpen, placement, fallbackPlacements, align, offset, onClose } = props;
  const state = usePopoverCoreState(placement);
  const resolvePosition = usePopoverPositionUpdater({
    anchorRef,
    contentRef: state.contentRef,
    placement,
    fallbackPlacements,
    align,
    offset,
  });
  const applyPosition = useApplyPopoverPosition({
    isOpen,
    resolvePosition,
    setPosition: state.setPosition,
    setActivePlacement: state.setActivePlacement,
    setVisible: state.setVisible,
  });
  const { clearFrame, scheduleUpdate } = useFrameController({
    frameRef: state.frameRef,
    isOpen,
    applyPosition,
  });
  usePositioningCycle({ isOpen, scheduleUpdate, clearFrame });
  useGlobalDismissHandlers({
    isOpen,
    anchorRef,
    contentRef: state.contentRef,
    onClose,
    scheduleUpdate,
    setVisible: state.setVisible,
  });
  usePlacementReset({
    isOpen,
    placement,
    setVisible: state.setVisible,
    setActivePlacement: state.setActivePlacement,
  });
  return {
    setContentNode: state.setContentNode,
    position: state.position,
    visible: state.visible,
    activePlacement: state.activePlacement,
  };
}
