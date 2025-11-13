import { forwardRef } from "react";
import PropTypes from "prop-types";
import SidebarView from "./SidebarView.jsx";
import { useSidebarModel } from "./useSidebarModel.ts";

const Sidebar = forwardRef(function Sidebar(props, ref) {
  const { viewProps } = useSidebarModel(props);
  return <SidebarView ref={ref} {...viewProps} />;
});

Sidebar.propTypes = {
  isMobile: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onShowDictionary: PropTypes.func,
  onShowLibrary: PropTypes.func,
  activeView: PropTypes.string,
  onSelectHistory: PropTypes.func,
};

Sidebar.defaultProps = {
  isMobile: undefined,
  open: false,
  onClose: undefined,
  onShowDictionary: undefined,
  onShowLibrary: undefined,
  activeView: undefined,
  onSelectHistory: undefined,
};

export default Sidebar;
