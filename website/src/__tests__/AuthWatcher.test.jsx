/* eslint-env jest */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
let currentUser = null;

jest.unstable_mockModule("@/context", () => ({
  useUser: () => ({ user: currentUser }),
}));

jest.unstable_mockModule("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const router = await import("react-router-dom");
const { MemoryRouter } = router;
const { default: AuthWatcher } = await import("@/components/AuthWatcher");

beforeEach(() => {
  currentUser = null;
  mockNavigate.mockClear();
});

/**
 * 测试逻辑：在无用户信息且访问受保护路径时，应重定向到登录页。
 * 测试步骤：设置 currentUser 为空，使用 MemoryRouter 从受保护路径启动，渲染组件并等待导航行为。
 */
test("redirects anonymous visitor to login when accessing protected route", async () => {
  currentUser = null;

  render(
    <MemoryRouter initialEntries={["/settings"]}>
      <AuthWatcher />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true }),
  );
});

/**
 * 测试逻辑：在已有用户信息且访问公共认证路径时，应重定向到首页以避免重复访问认证页。
 * 测试步骤：设置 currentUser 为模拟用户，使用 MemoryRouter 从 /login 启动，渲染组件并等待导航行为。
 */
test("redirects authenticated visitor away from public auth routes", async () => {
  currentUser = { id: "user-1" };

  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthWatcher />
    </MemoryRouter>,
  );

  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true }),
  );
});
