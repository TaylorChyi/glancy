import { useEffect, useLayoutEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function usePositioningCycle({ isOpen, scheduleUpdate, clearFrame }) {
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return undefined;
    scheduleUpdate();
    return () => {
      clearFrame();
    };
  }, [clearFrame, isOpen, scheduleUpdate]);
}

const attachGlobalListeners = ({
  handleResize,
  handleScroll,
  handlePointerDown,
  handleKeyDown,
}) => {
  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, true);
  document.addEventListener("pointerdown", handlePointerDown);
  document.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll, true);
    document.removeEventListener("pointerdown", handlePointerDown);
    document.removeEventListener("keydown", handleKeyDown);
  };
};

const createPointerDownHandler = ({ anchorRef, contentRef, onClose }) => {
  return (event) => {
    const anchorEl = anchorRef?.current;
    const popoverEl = contentRef.current;
    if (popoverEl?.contains(event.target)) return;
    if (anchorEl?.contains(event.target)) return;
    onClose?.();
  };
};

const createKeyDownHandler = (onClose) => (event) => {
  if (event.key === "Escape") {
    onClose?.();
  }
};

const observeAnchorAndContent = ({
  anchorRef,
  contentRef,
  scheduleUpdate,
}) => {
  if (typeof ResizeObserver === "undefined") {
    return null;
  }
  const observer = new ResizeObserver(() => scheduleUpdate());
  if (anchorRef?.current) observer.observe(anchorRef.current);
  if (contentRef.current) observer.observe(contentRef.current);
  return observer;
};

export function useGlobalDismissHandlers({
  isOpen,
  anchorRef,
  contentRef,
  onClose,
  scheduleUpdate,
  setVisible,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    setVisible(false);

    const listenerCleanup = attachGlobalListeners({
      handleResize: scheduleUpdate,
      handleScroll: scheduleUpdate,
      handlePointerDown: createPointerDownHandler({
        anchorRef,
        contentRef,
        onClose,
      }),
      handleKeyDown: createKeyDownHandler(onClose),
    });

    const resizeObserver = observeAnchorAndContent({
      anchorRef,
      contentRef,
      scheduleUpdate,
    });

    return () => {
      listenerCleanup();
      resizeObserver?.disconnect();
    };
  }, [anchorRef, contentRef, isOpen, onClose, scheduleUpdate, setVisible]);
}

export function usePlacementReset({
  isOpen,
  placement,
  setVisible,
  setActivePlacement,
}) {
  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      setActivePlacement(placement);
    }
  }, [isOpen, placement, setActivePlacement, setVisible]);
}
