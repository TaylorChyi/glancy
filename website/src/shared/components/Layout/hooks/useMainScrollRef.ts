import { MutableRefObject, useEffect, useRef } from "react";

type UseMainScrollRefParams = {
  onScroll?: (event: Event) => void;
};

type UseMainScrollRefResult = MutableRefObject<HTMLElement | null>;

export const useMainScrollRef = ({
  onScroll,
}: UseMainScrollRefParams): UseMainScrollRefResult => {
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!onScroll) return;
    const node = contentRef.current;
    if (!node) return;
    const handleScroll = (event: Event) => onScroll(event);
    node.addEventListener("scroll", handleScroll);
    return () => node.removeEventListener("scroll", handleScroll);
  }, [onScroll]);

  return contentRef;
};
