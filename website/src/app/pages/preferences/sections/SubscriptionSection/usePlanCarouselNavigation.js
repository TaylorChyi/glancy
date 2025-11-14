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

const createInitialScrollState = (planCount) => ({
  isAtStart: true,
  isAtEnd: planCount <= 1,
});

const getScrollState = (node) => {
  if (!node) {
    return { isAtStart: true, isAtEnd: true };
  }

  const { scrollLeft, clientWidth, scrollWidth } = node;
  return {
    isAtStart: scrollLeft <= 1,
    isAtEnd: scrollLeft + clientWidth >= scrollWidth - 1,
  };
};

const usePlanRailScrollState = (viewportRef, planCount) => {
  const [scrollState, setScrollState] = useState(() =>
    createInitialScrollState(planCount),
  );

  const syncPosition = useCallback(() => {
    setScrollState(getScrollState(viewportRef.current));
  }, [viewportRef]);

  usePlanRailScrollSync(viewportRef, syncPosition);
  usePlanRailInitialSync(planCount, syncPosition);

  return scrollState;
};

const usePlanRailViewport = (planCount) => {
  const viewportRef = useRef(null);
  const scrollState = usePlanRailScrollState(viewportRef, planCount);
  return { viewportRef, ...scrollState };
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

const createPlanRailNav = ({
  planCount,
  viewportRef,
  isAtStart,
  isAtEnd,
  onPrev,
  onNext,
}) => {
  const shouldRenderNav = planCount > 1;
  return {
    viewportRef,
    showPrevNav: shouldRenderNav && !isAtStart,
    showNextNav: shouldRenderNav && !isAtEnd,
    isAtStart,
    isAtEnd,
    onPrev,
    onNext,
    prevLabel: "查看前一个订阅方案",
    nextLabel: "查看后一个订阅方案",
  };
};

const usePlanRailNav = (planCount) => {
  const { viewportRef, isAtStart, isAtEnd } = usePlanRailViewport(planCount);
  const { onPrev, onNext } = usePlanRailControls(viewportRef);

  return useMemo(
    () =>
      createPlanRailNav({
        planCount,
        viewportRef,
        isAtStart,
        isAtEnd,
        onPrev,
        onNext,
      }),
    [isAtEnd, isAtStart, onNext, onPrev, planCount, viewportRef],
  );
};

export const usePlanCarouselNavigation = (planCount) => ({
  planRailNav: usePlanRailNav(planCount),
});
