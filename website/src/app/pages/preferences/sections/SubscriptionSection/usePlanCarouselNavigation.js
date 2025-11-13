import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const usePlanCarouselNavigation = (planCount) => {
  const planCarouselRef = useRef(null);
  const [isPlanRailAtStart, setIsPlanRailAtStart] = useState(true);
  const [isPlanRailAtEnd, setIsPlanRailAtEnd] = useState(false);

  const syncPlanRailPosition = useCallback(() => {
    const node = planCarouselRef.current;
    if (!node) {
      setIsPlanRailAtStart(true);
      setIsPlanRailAtEnd(true);
      return;
    }

    const { scrollLeft, clientWidth, scrollWidth } = node;
    setIsPlanRailAtStart(scrollLeft <= 1);
    setIsPlanRailAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
  }, []);

  useEffect(() => {
    const node = planCarouselRef.current;
    if (!node) {
      return undefined;
    }

    const handleScroll = () => {
      syncPlanRailPosition();
    };

    handleScroll();
    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [syncPlanRailPosition]);

  useEffect(() => {
    syncPlanRailPosition();
  }, [planCount, syncPlanRailPosition]);

  const handlePlanRailNav = useCallback((direction) => {
    const node = planCarouselRef.current;
    if (!node) {
      return;
    }

    const scrollAmount = node.clientWidth * 0.85;
    node.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  }, []);

  const handlePrevNav = useCallback(() => {
    handlePlanRailNav(-1);
  }, [handlePlanRailNav]);

  const handleNextNav = useCallback(() => {
    handlePlanRailNav(1);
  }, [handlePlanRailNav]);

  const shouldRenderPlanRailNav = planCount > 1;

  const planRailNav = useMemo(
    () => ({
      viewportRef: planCarouselRef,
      showPrevNav: shouldRenderPlanRailNav && !isPlanRailAtStart,
      showNextNav: shouldRenderPlanRailNav && !isPlanRailAtEnd,
      isAtStart: isPlanRailAtStart,
      isAtEnd: isPlanRailAtEnd,
      onPrev: handlePrevNav,
      onNext: handleNextNav,
      prevLabel: "查看前一个订阅方案",
      nextLabel: "查看后一个订阅方案",
    }),
    [
      handleNextNav,
      handlePrevNav,
      isPlanRailAtEnd,
      isPlanRailAtStart,
      shouldRenderPlanRailNav,
    ],
  );

  return { planRailNav };
};
