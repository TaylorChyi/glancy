import { useEffect } from "react";

const VH_CUSTOM_PROPERTY = "--vh";

function ViewportHeightUpdater() {
  useEffect(() => {
    const updateViewportHeight = () => {
      document.documentElement.style.setProperty(
        VH_CUSTOM_PROPERTY,
        `${window.innerHeight}px`,
      );
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight, { passive: true });

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  return null;
}

export default ViewportHeightUpdater;
