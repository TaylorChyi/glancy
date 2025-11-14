import PropTypes from "prop-types";
import SettingsBody from "../SettingsBody.jsx";
import SettingsPanel from "../SettingsPanel.jsx";
import useStableSettingsPanelHeight from "../useStableSettingsPanelHeight.js";
import { useMemo } from "react";

class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = new Set();
  }

  observe(target) {
    this.targets.add(target);
    const height = Number(target?.dataset?.testHeight ?? 0);
    this.callback([{ target, contentRect: { height } }]);
  }

  unobserve(target) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
  }
}

function TestSection({ headingId }) {
  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId}>Probe heading</h3>
    </section>
  );
}

TestSection.propTypes = {
  headingId: PropTypes.string.isRequired,
};

function createHeightHarnessSections() {
  return [
    {
      id: "general",
      label: "General",
      Component: TestSection,
      componentProps: { title: "General" },
    },
    {
      id: "data",
      label: "Data",
      Component: TestSection,
      componentProps: { title: "Data" },
    },
  ];
}

function createReferenceMeasurementProbe(referenceMeasurement, referenceHeight) {
  if (!referenceMeasurement) {
    return null;
  }

  return (
    <div
      aria-hidden
      data-test-height={referenceHeight}
      ref={(node) => {
        if (node) {
          node.dataset.testHeight = String(referenceHeight);
        }
        referenceMeasurement.registerNode(node);
      }}
    >
      <referenceMeasurement.Component {...referenceMeasurement.props} />
    </div>
  );
}

function HarnessSettingsPanel({ activeHeight, registerActivePanelNode }) {
  return (
    <SettingsPanel
      panelId="general-panel"
      tabId="general-tab"
      headingId="general-heading"
      onPanelElementChange={(node) => {
        if (node) {
          node.dataset.testHeight = String(activeHeight);
        }
        registerActivePanelNode(node);
      }}
    >
      <TestSection headingId="general-heading" />
    </SettingsPanel>
  );
}

HarnessSettingsPanel.propTypes = {
  activeHeight: PropTypes.number.isRequired,
  registerActivePanelNode: PropTypes.func.isRequired,
};

function HeightHarness({
  referenceSectionId = "data",
  activeHeight = 320,
  referenceHeight = 640,
}) {
  const sections = useMemo(createHeightHarnessSections, []);

  const { bodyStyle, registerActivePanelNode, referenceMeasurement } =
    useStableSettingsPanelHeight({
      sections,
      activeSectionId: "general",
      referenceSectionId,
    });

  const measurementProbe = createReferenceMeasurementProbe(
    referenceMeasurement,
    referenceHeight,
  );

  return (
    <SettingsBody style={bodyStyle} measurementProbe={measurementProbe}>
      <div role="presentation">navigation</div>
      <HarnessSettingsPanel
        activeHeight={activeHeight}
        registerActivePanelNode={registerActivePanelNode}
      />
    </SettingsBody>
  );
}

HeightHarness.propTypes = {
  referenceSectionId: PropTypes.string,
  activeHeight: PropTypes.number,
  referenceHeight: PropTypes.number,
};

HeightHarness.defaultProps = {
  referenceSectionId: "data",
  activeHeight: 320,
  referenceHeight: 640,
};

function FallbackMeasurementHarness({
  panelInstanceKey,
  getBoundingClientRect,
  activeSectionId = "general",
}) {
  const sections = useMemo(
    () => [
      {
        id: "general",
        label: "General",
        Component: TestSection,
        componentProps: { title: "General" },
      },
    ],
    [],
  );

  const { bodyStyle, registerActivePanelNode } = useStableSettingsPanelHeight({
    sections,
    activeSectionId,
    referenceSectionId: "unknown",
  });

  return (
    <SettingsBody style={bodyStyle}>
      <div role="presentation">navigation</div>
      <SettingsPanel
        key={panelInstanceKey}
        panelId={`${activeSectionId}-panel-${panelInstanceKey}`}
        tabId={`${activeSectionId}-tab-${panelInstanceKey}`}
        headingId="general-heading"
        onPanelElementChange={(node) => {
          if (node) {
            node.getBoundingClientRect = getBoundingClientRect;
          }
          registerActivePanelNode(node);
        }}
      >
        <TestSection headingId="general-heading" />
      </SettingsPanel>
    </SettingsBody>
  );
}

FallbackMeasurementHarness.propTypes = {
  panelInstanceKey: PropTypes.string.isRequired,
  getBoundingClientRect: PropTypes.func.isRequired,
  activeSectionId: PropTypes.string,
};

FallbackMeasurementHarness.defaultProps = {
  activeSectionId: "general",
};

export { MockResizeObserver, HeightHarness, FallbackMeasurementHarness };
