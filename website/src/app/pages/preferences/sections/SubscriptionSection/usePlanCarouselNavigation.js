import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const usePlanRailScrollSync = (viewportRef, syncPosition) => {
  useEffect(() => {
    const node = viewportRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = () => syncPosition();
    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [syncPosition, viewportRef]);
};

const usePlanRailInitialSync = (planCount, syncPosition) => {
  useEffect(() => {
    syncPosition();
  }, [planCount, syncPosition]);
};

const usePlanRailViewport = (planCount) => {
  const viewportRef = useRef(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const syncPosition = useCallback(() => {
    const node = viewportRef.current;
    if (!node) {
      setIsAtStart(true);
      setIsAtEnd(true);
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = node;
    setIsAtStart(scrollLeft <= 1);
    setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  usePlanRailScrollSync(viewportRef, syncPosition);
  usePlanRailInitialSync(planCount, syncPosition);

  return { viewportRef, isAtStart, isAtEnd };
};

const usePlanRailControls = (viewportRef) => {
  const scrollByDirection = useCallback((direction) => {
    const node = viewportRef.current;
    if (!node) {
      return;
    }

    const scrollAmount = node.clientWidth * 0.85;
    node.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }, [viewportRef]);

  const onPrev = useCallback(() => {
    scrollByDirection(-1);
  }, [scrollByDirection]);

  const onNext = useCallback(() => {
    scrollByDirection(1);
  }, [scrollByDirection]);

  return { onPrev, onNext };
};

export const usePlanCarouselNavigation = (planCount) => {
  const { viewportRef, isAtStart, isAtEnd } = usePlanRailViewport(planCount);
  const { onPrev, onNext } = usePlanRailControls(viewportRef);
  const shouldRenderNav = planCount > 1;

  const planRailNav = useMemo(
    () => ({
      viewportRef,
      showPrevNav: shouldRenderNav && !isAtStart,
      showNextNav: shouldRenderNav && !isAtEnd,
      isAtStart,
      isAtEnd,
      onPrev,
      onNext,
      prevLabel: "查看前一个订阅方案",
      nextLabel: "查看后一个订阅方案",
    }),
    [isAtEnd, isAtStart, onNext, onPrev, shouldRenderNav, viewportRef],
  );

  return { planRailNav };
};
