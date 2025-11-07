import { useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";

function SettingsPanel({
  panelId,
  tabId,
  headingId,
  className,
  children,
  onHeadingElementChange,
  onPanelElementChange,
}) {
  const panelElementRef = useRef(null);
  const headingElementRef = useRef(null);

  useLayoutEffect(() => {
    if (typeof onPanelElementChange !== "function") {
      return undefined;
    }

    onPanelElementChange(panelElementRef.current ?? null);

    return () => {
      onPanelElementChange(null);
    };
  }, [onPanelElementChange, panelId, tabId]);

  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    if (!headingId) {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    const nextHeading = document.getElementById(headingId);
    headingElementRef.current = nextHeading ?? null;
    if (typeof onHeadingElementChange === "function") {
      onHeadingElementChange(headingElementRef.current);
    }

    return () => {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
    };
  }, [headingId, onHeadingElementChange]);

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      className={className}
      ref={panelElementRef}
    >
      {children}
    </div>
  );
}

SettingsPanel.propTypes = {
  panelId: PropTypes.string.isRequired,
  tabId: PropTypes.string.isRequired,
  headingId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  onHeadingElementChange: PropTypes.func,
  onPanelElementChange: PropTypes.func,
};

SettingsPanel.defaultProps = {
  headingId: undefined,
  className: "",
  children: null,
  onHeadingElementChange: undefined,
  onPanelElementChange: undefined,
};

export default SettingsPanel;
