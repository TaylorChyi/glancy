import { useRef } from "react";
import PropTypes from "prop-types";
import {
  useHeadingRegistration,
  usePanelElementRegistration,
} from "./useSettingsPanelRegistrations";

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

  usePanelElementRegistration({
    panelElementRef,
    onPanelElementChange,
    panelId,
    tabId,
  });

  useHeadingRegistration({
    headingId,
    headingElementRef,
    onHeadingElementChange,
  });

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
