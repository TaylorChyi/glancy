/**
 * 背景：
 *  - useStableSettingsPanelHeight 负责同步设置面板的统一高度，需要确保参考面板优先。
 * 目的：
 *  - 验证 hook 在存在参考分区时采用其高度，在缺失时回退至当前激活分区。
 * 关键决策与取舍：
 *  - 通过自定义 ResizeObserver 桩件直接注入测试高度，避免依赖真实布局计算。
 * 影响范围：
 *  - 设置模态与页面的高度稳定性逻辑。
 * 演进与TODO：
 *  - TODO: 后续可补充宽度同步断言，覆盖更多响应式场景。
 */
import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
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

const originalResizeObserver = global.ResizeObserver;

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

function HeightHarness({
  referenceSectionId = "data",
  activeHeight = 320,
  referenceHeight = 640,
}) {
  const sections = useMemo(
    () => [
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
    ],
    [],
  );

  const { bodyStyle, registerActivePanelNode, referenceMeasurement } =
    useStableSettingsPanelHeight({
      sections,
      activeSectionId: "general",
      referenceSectionId,
    });

  const measurementProbe = referenceMeasurement ? (
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
  ) : null;

  return (
    <SettingsBody style={bodyStyle} measurementProbe={measurementProbe}>
      <div role="presentation">navigation</div>
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

beforeEach(() => {
  global.ResizeObserver = MockResizeObserver;
});

afterEach(() => {
  global.ResizeObserver = originalResizeObserver;
});

/**
 * 测试目标：存在参考分区时应使用其高度写入 CSS 变量。
 * 前置条件：渲染 HeightHarness，提供 referenceHeight。
 * 步骤：
 *  1) 渲染组件；
 *  2) 读取根节点 style。
 * 断言：
 *  - --settings-body-height 等于 640px。
 * 边界/异常：
 *  - 若未来参考分区标识变更需同步更新测试参数。
 */
test("Given reference section When measuring height Then uses reference height", () => {
  const { container } = render(<HeightHarness referenceHeight={640} />);

  expect(container.firstChild).toHaveStyle("--settings-body-height: 640px");
});

/**
 * 测试目标：缺失参考分区时回退至当前激活分区高度。
 * 前置条件：渲染 HeightHarness，传入不存在的 referenceSectionId。
 * 步骤：
 *  1) 渲染组件；
 *  2) 读取根节点 style。
 * 断言：
 *  - --settings-body-height 使用激活分区高度 480px。
 * 边界/异常：
 *  - 若未来增加其他回退策略需同步调整断言。
 */
test("Given missing reference section When measuring height Then falls back to active height", () => {
  const { container } = render(
    <HeightHarness referenceSectionId="unknown" activeHeight={480} />,
  );

  expect(container.firstChild).toHaveStyle("--settings-body-height: 480px");
});

/**
 * 测试目标：参考分区高度小于回退高度时优先使用实际测量值。
 * 前置条件：渲染 HeightHarness，参考高度 280，小于激活分区高度 640。
 * 步骤：
 *  1) 渲染组件；
 *  2) 读取根节点 style。
 * 断言：
 *  - --settings-body-height 使用 280px 而非 640px。
 * 边界/异常：
 *  - 若参考测量逻辑调整为包含其他因子需同步更新断言。
 */
test("Given smaller reference section When measuring height Then uses measured reference height", () => {
  const { container } = render(
    <HeightHarness activeHeight={640} referenceHeight={280} />,
  );

  expect(container.firstChild).toHaveStyle("--settings-body-height: 280px");
});

/**
 * 测试目标：在缺少 ResizeObserver 时应复用缓存高度，避免重复同步。
 * 前置条件：ResizeObserver 未定义，首次测量返回 420。
 * 步骤：
 *  1) 渲染 FallbackMeasurementHarness 并触发初次测量；
 *  2) 以不同 panelInstanceKey 重新渲染模拟分区重建。
 * 断言：
 *  - CSS 变量维持 420px；
 *  - getBoundingClientRect 仅调用一次。
 * 边界/异常：
 *  - 若未来缓存键策略调整，需同步断言调用次数。
 */
test("Given cached measurements without observer When remounting Then reuses cached height", () => {
  global.ResizeObserver = undefined;
  const getBoundingClientRect = jest
    .fn()
    .mockReturnValueOnce({ height: 420 })
    .mockReturnValue({ height: 999 });

  const { container, rerender } = render(
    <FallbackMeasurementHarness
      panelInstanceKey="initial"
      getBoundingClientRect={getBoundingClientRect}
    />,
  );

  expect(container.firstChild).toHaveStyle("--settings-body-height: 420px");
  expect(getBoundingClientRect).toHaveBeenCalledTimes(1);

  rerender(
    <FallbackMeasurementHarness
      panelInstanceKey="remounted"
      getBoundingClientRect={getBoundingClientRect}
    />,
  );

  expect(container.firstChild).toHaveStyle("--settings-body-height: 420px");
  expect(getBoundingClientRect).toHaveBeenCalledTimes(1);
});
