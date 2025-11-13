import PropTypes from "prop-types";
import SettingsSectionsViewportView from "./SettingsSectionsViewportView.jsx";
import { useSettingsSectionsViewportModel } from "./useSettingsSectionsViewportModel.ts";

function SettingsSectionsViewport(props) {
  const { viewProps } = useSettingsSectionsViewportModel(props);
  return <SettingsSectionsViewportView {...viewProps} />;
}

SettingsSectionsViewport.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string.isRequired,
  onSectionSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  referenceSectionId: PropTypes.string,
  body: PropTypes.shape({
    className: PropTypes.string,
    style: PropTypes.shape({}),
    props: PropTypes.shape({}),
  }),
  nav: PropTypes.shape({
    classes: PropTypes.shape({}),
    props: PropTypes.shape({}),
  }),
  panel: PropTypes.shape({
    panelId: PropTypes.string.isRequired,
    tabId: PropTypes.string.isRequired,
    headingId: PropTypes.string,
    className: PropTypes.string,
    surfaceClassName: PropTypes.string,
    probeClassName: PropTypes.string,
  }).isRequired,
  onHeadingElementChange: PropTypes.func,
  onPanelElementChange: PropTypes.func,
  children: PropTypes.node,
};

SettingsSectionsViewport.defaultProps = {
  renderCloseAction: undefined,
  referenceSectionId: "data",
  body: undefined,
  nav: undefined,
  onHeadingElementChange: undefined,
  onPanelElementChange: undefined,
  children: null,
};

export default SettingsSectionsViewport;
