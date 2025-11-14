import { MutableRefObject, useRef } from "react";

export const useLayoutContainerRef = (): MutableRefObject<HTMLDivElement | null> =>
  useRef<HTMLDivElement | null>(null);
