/**
 * 背景：
 *  - 响应风格相关测试需频繁设置 profile mock，与其它场景放在一起冗长难维护。
 * 目的：
 *  - 独立验证加载失败重试与字段提交逻辑，确保个性化体验稳健。
 * 关键决策与取舍：
 *  - 使用共享装配器以 builder 方式覆写 profile 数据，避免在测试内重复铺设 mock；
 *  - 单文件聚焦 response style，降低结构复杂度。
 * 影响范围：
 *  - usePreferenceSections 中 response style 相关分支的测试组织。
 * 演进与TODO：
 *  - 若未来扩展更多字段校验，可继续在此文件补充。
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  createPreferenceSectionsTestContext,
  loadPreferenceSectionsModules,
} from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let activeContext;

const setupContext = (options) => {
  if (activeContext) {
    activeContext.restore();
  }
  activeContext = createPreferenceSectionsTestContext(options);
  return activeContext;
};

beforeAll(async () => {
  ({ usePreferenceSections } = await loadPreferenceSectionsModules());
});

afterEach(() => {
  if (activeContext) {
    activeContext.restore();
    activeContext = undefined;
  }
});

/**
 * 测试目标：响应风格请求失败后暴露 error 状态并可通过 onRetry 重试。
 * 前置条件：首次请求抛出异常。
 * 步骤：
 *  1) 渲染 Hook；
 *  2) 等待状态变为 error；
 *  3) 调用 onRetry。
 * 断言：
 *  - onRetry 触发后再次调用 fetchProfile；
 *  - 状态最终回到 ready。
 * 边界/异常：
 *  - 若重试未恢复则断言失败。
 */
test("Given response style fetch fails When retry invoked Then status recovers", async () => {
  const context = setupContext();
  context.fetchProfileMock
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce({
      job: "Writer",
      goal: "C1",
      currentAbility: "B2",
      education: "Master",
      interest: "Literature",
      responseStyle: "nerd",
      customSections: [],
    });

  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    expect(responseStyleSection.componentProps.state.status).toBe("error");
  });

  await act(async () => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    await responseStyleSection.componentProps.onRetry();
  });

  await waitFor(() => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    expect(responseStyleSection.componentProps.state.status).toBe("ready");
    expect(responseStyleSection.componentProps.state.values.responseStyle).toBe(
      "nerd",
    );
  });

  expect(context.fetchProfileMock).toHaveBeenCalledTimes(2);
});

/**
 * 测试目标：更新响应风格字段时应触发保存请求并传递裁剪后的值。
 * 前置条件：默认 mock 返回的档案已加载完成。
 * 步骤：
 *  1) 修改 goal 字段；
 *  2) 触发 onFieldCommit；
 * 断言：
 *  - saveProfile 被调用一次；
 *  - 请求体包含去除首尾空格后的值。
 * 边界/异常：无。
 */
test("Given response style edit When committing field Then saveProfile dispatches sanitized payload", async () => {
  const context = setupContext();
  const { result } = renderHook(() =>
    usePreferenceSections({ initialSectionId: undefined }),
  );

  await waitFor(() => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    expect(responseStyleSection.componentProps.state.status).toBe("ready");
  });

  act(() => {
    const responseStyleSection = result.current.sections.find(
      (section) => section.id === "responseStyle",
    );
    responseStyleSection.componentProps.onFieldChange("goal", "  IELTS  ");
  });

  const latestSection = result.current.sections.find(
    (section) => section.id === "responseStyle",
  );

  await act(async () => {
    await latestSection.componentProps.onFieldCommit("goal");
  });

  expect(context.saveProfileMock).toHaveBeenCalledTimes(1);
  expect(context.saveProfileMock).toHaveBeenCalledWith({
    token: "token-123",
    profile: {
      job: "Engineer",
      interest: "AI",
      goal: "IELTS",
      education: "Bachelor",
      currentAbility: "B1",
      responseStyle: "default",
      customSections: [],
    },
  });
});
