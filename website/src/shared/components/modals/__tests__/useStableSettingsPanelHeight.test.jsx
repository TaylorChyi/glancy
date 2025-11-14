import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import {
  MockResizeObserver,
  HeightHarness,
  FallbackMeasurementHarness,
} from "./useStableSettingsPanelHeight.test.helpers.jsx";

const originalResizeObserver = global.ResizeObserver;

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
