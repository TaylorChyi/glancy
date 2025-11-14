import { useRef } from "react";

const useViewportRefs = () => {
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  return { imageRef, containerRef };
};

export default useViewportRefs;
