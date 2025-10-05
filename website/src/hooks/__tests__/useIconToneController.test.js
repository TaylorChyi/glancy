/* eslint-env jest */
import React from "react";
import { renderHook } from "@testing-library/react";

import useIconToneController from "../useIconToneController.js";
import { ThemeContext } from "@/context";

const createWrapper = (resolvedTheme) =>
  function Wrapper({ children }) {
    return (
      <ThemeContext.Provider
        value={{ theme: resolvedTheme, resolvedTheme, setTheme: () => {} }}
      >
        {children}
      </ThemeContext.Provider>
    );
  };

/**
 * 测试目标：请求 inverse tone 时应返回 isInverse=true 且提供反相颜色令牌。
 * 前置条件：主题上下文解析为 light。
 * 步骤：
 *  1) 通过 renderHook 渲染 useIconToneController 并传入 tone="inverse"。
 * 断言：
 *  - tone 为 "inverse"；
 *  - isInverse 为 true；
 *  - colorToken 指向 color-text-inverse。
 * 边界/异常：
 *  - 若策略表缺失 inverse，colorToken 将为空导致断言失败。
 */
test("GivenInverseTone_WhenResolving_ThenExposeInverseVariant", () => {
  const { result } = renderHook(
    () => useIconToneController({ tone: "inverse" }),
    {
      wrapper: createWrapper("light"),
    },
  );

  expect(result.current.tone).toBe("inverse");
  expect(result.current.isInverse).toBe(true);
  expect(result.current.colorToken).toBe(
    "var(--color-text-inverse, var(--neutral-0))",
  );
});

/**
 * 测试目标：auto 策略应根据 light 主题切换到 inverse 语义。
 * 前置条件：主题上下文解析为 light。
 * 步骤：
 *  1) 渲染 hook 并读取返回对象。
 * 断言：
 *  - tone 为 "inverse"；
 *  - isInverse 为 true。
 * 边界/异常：
 *  - 若 auto 策略未应用 light 分支，将导致 tone 不为 inverse。
 */
test("GivenLightThemeWithAutoTone_WhenResolving_ThenReturnsInverse", () => {
  const { result } = renderHook(() => useIconToneController(), {
    wrapper: createWrapper("light"),
  });

  expect(result.current.tone).toBe("inverse");
  expect(result.current.isInverse).toBe(true);
});

/**
 * 测试目标：auto 策略在 dark 主题下应维持默认色调，避免额外反转。
 * 前置条件：主题上下文解析为 dark。
 * 步骤：
 *  1) 渲染 hook 并读取返回值。
 * 断言：
 *  - tone 为 "default"；
 *  - isInverse 为 false；
 *  - colorToken 指向 color-text。
 * 边界/异常：
 *  - 若策略错误返回 inverse，将导致断言失败并暴露逻辑缺陷。
 */
test("GivenDarkThemeWithAutoTone_WhenResolving_ThenReturnsDefault", () => {
  const { result } = renderHook(() => useIconToneController(), {
    wrapper: createWrapper("dark"),
  });

  expect(result.current.tone).toBe("default");
  expect(result.current.isInverse).toBe(false);
  expect(result.current.colorToken).toBe("var(--color-text)");
});

/**
 * 测试目标：未知 tone key 应回退到 default 策略，防止运行时抛错。
 * 前置条件：主题上下文解析为 dark。
 * 步骤：
 *  1) 以 tone="brand" 调用 hook。
 * 断言：
 *  - tone 为 "default"；
 *  - isInverse 为 false。
 * 边界/异常：
 *  - 若未实现回退策略将抛出异常导致测试失败。
 */
test("GivenUnknownTone_WhenResolving_ThenFallbackToDefault", () => {
  const { result } = renderHook(
    () => useIconToneController({ tone: "brand" }),
    {
      wrapper: createWrapper("dark"),
    },
  );

  expect(result.current.tone).toBe("default");
  expect(result.current.isInverse).toBe(false);
});
