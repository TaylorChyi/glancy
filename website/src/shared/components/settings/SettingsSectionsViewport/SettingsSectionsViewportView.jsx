import PropTypes from "prop-types";
import SettingsBody from "@shared/components/modals/SettingsBody.jsx";
import SettingsNav from "@shared/components/modals/SettingsNav.jsx";
import SettingsPanel from "@shared/components/modals/SettingsPanel.jsx";
import MeasurementProbe from "./parts/MeasurementProbe.jsx";

function SettingsViewportBody({ body, measurement, children }) {
  return (
    <SettingsBody
      className={body.className}
      style={body.style}
      measurementProbe={<MeasurementProbe measurement={measurement} />}
      {...body.rest}
    >
      {children}
    </SettingsBody>
  );
}

function SettingsViewportNav({
  nav,
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
}) {
  return (
    <SettingsNav
      sections={sections}
      activeSectionId={activeSectionId}
      onSelect={onSectionSelect}
      tablistLabel={tablistLabel}
      renderCloseAction={renderCloseAction}
      classes={nav.classes}
      {...nav.rest}
    />
  );
}

function SettingsViewportPanel({ panel, handlers, children }) {
  return (
    <SettingsPanel
      panelId={panel.panelId}
      tabId={panel.tabId}
      headingId={panel.headingId}
      className={panel.className}
      onHeadingElementChange={handlers.onHeadingElementChange}
      onPanelElementChange={handlers.onPanelElementChange}
    >
      {children}
    </SettingsPanel>
  );
}

function SettingsSectionsViewportView({
  body,
  nav,
  panel,
  measurement,
  handlers,
  sections,
  activeSectionId,
  onSectionSelect,
  tablistLabel,
  renderCloseAction,
  children,
}) {
  return (
    <SettingsViewportBody body={body} measurement={measurement}>
      <SettingsViewportNav
        nav={nav}
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionSelect={onSectionSelect}
        tablistLabel={tablistLabel}
        renderCloseAction={renderCloseAction}
      />
      <SettingsViewportPanel panel={panel} handlers={handlers}>
        {children}
      </SettingsViewportPanel>
    </SettingsViewportBody>
  );
}

SettingsSectionsViewportView.propTypes = {
  body: PropTypes.shape({
    className: PropTypes.string,
    style: PropTypes.shape({}),
    rest: PropTypes.shape({}),
  }).isRequired,
  nav: PropTypes.shape({
    classes: PropTypes.shape({}),
    rest: PropTypes.shape({}),
  }).isRequired,
  panel: PropTypes.shape({
    panelId: PropTypes.string.isRequired,
    tabId: PropTypes.string.isRequired,
    headingId: PropTypes.string,
    className: PropTypes.string,
  }).isRequired,
  measurement: PropTypes.shape({
    referenceMeasurement: PropTypes.shape({}),
    panelProbeClassName: PropTypes.string,
  }),
  handlers: PropTypes.shape({
    onHeadingElementChange: PropTypes.func,
    onPanelElementChange: PropTypes.func,
  }).isRequired,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  activeSectionId: PropTypes.string.isRequired,
  onSectionSelect: PropTypes.func.isRequired,
  tablistLabel: PropTypes.string.isRequired,
  renderCloseAction: PropTypes.func,
  children: PropTypes.node,
};

SettingsSectionsViewportView.defaultProps = {
  measurement: undefined,
  renderCloseAction: undefined,
  children: null,
};

export default SettingsSectionsViewportView;
