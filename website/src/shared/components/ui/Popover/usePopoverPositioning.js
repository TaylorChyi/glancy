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
  return usePopoverPositioningLifecycle({
    state,
    anchorRef,
    isOpen,
    placement,
    onClose,
    applyPosition,
  });
}

function usePopoverPositioningLifecycle({
  state,
  anchorRef,
  isOpen,
  placement,
  onClose,
  applyPosition,
}) {
  const { clearFrame, scheduleUpdate } = usePopoverFrame({
    frameRef: state.frameRef,
    isOpen,
    applyPosition,
  });
  usePopoverEventHandlers({
    isOpen,
    anchorRef,
    contentRef: state.contentRef,
    onClose,
    scheduleUpdate,
    setVisible: state.setVisible,
    placement,
    setActivePlacement: state.setActivePlacement,
    clearFrame,
  });
  return {
    setContentNode: state.setContentNode,
    position: state.position,
    visible: state.visible,
    activePlacement: state.activePlacement,
  };
}

function usePopoverFrame({ frameRef, isOpen, applyPosition }) {
  return useFrameController({
    frameRef,
    isOpen,
    applyPosition,
  });
}

function usePopoverEventHandlers({
  isOpen,
  anchorRef,
  contentRef,
  onClose,
  scheduleUpdate,
  setVisible,
  placement,
  setActivePlacement,
  clearFrame,
}) {
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
}
