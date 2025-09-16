/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { API_PATHS } from "@/config/api.js";

const mockSetUser = jest.fn();
const mockJsonRequest = jest.fn().mockResolvedValue({ id: "1", token: "t" });
const mockNavigate = jest.fn();
const mockHydrateClientSessionState = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule("@/context", () => ({
  useUser: () => ({ setUser: mockSetUser }),
  useTheme: () => ({ resolvedTheme: "light" }),
  useLanguage: () => ({
    t: {
      loginWelcome: "Welcome back",
      loginSwitch: "Don’t have an account?",
      continueButton: "Continue",
      invalidAccount: "Invalid account",
      loginButton: "Log in",
      registerButton: "Sign up",
      passwordPlaceholder: "Password",
      passwordOrCodePlaceholder: "Password / code",
      codePlaceholder: "Code",
      notImplementedYet: "Not implemented yet",
      termsOfUse: "Terms of Use",
      privacyPolicy: "Privacy Policy",
      or: "OR",
      usernamePlaceholder: "Enter username",
      emailPlaceholder: "Enter email",
      phonePlaceholder: "Phone number",
    },
  }),
}));
jest.unstable_mockModule("@/hooks", () => ({
  useApi: () => ({ jsonRequest: mockJsonRequest }),
}));
jest.unstable_mockModule("@/session/sessionLifecycle.js", () => ({
  hydrateClientSessionState: mockHydrateClientSessionState,
}));
jest.unstable_mockModule("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const router = await import("react-router-dom");
const { MemoryRouter } = router;
const { default: Login } = await import("@/pages/auth/Login");

test("logs in and navigates home", async () => {
  /**
   * 验证默认登录方式优先使用用户名，并在表单提交流程中依次触发
   * 网络请求、用户上下文更新、会话注入以及路由跳转。
   */
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByPlaceholderText("Enter username"), {
    target: { value: "glancy_user" },
  });
  fireEvent.change(screen.getByPlaceholderText("Password"), {
    target: { value: "pass" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() =>
    expect(mockJsonRequest).toHaveBeenCalledWith(
      API_PATHS.login,
      expect.objectContaining({
        method: "POST",
        body: {
          account: "glancy_user",
          password: "pass",
          method: "username",
        },
      }),
    ),
  );
  await waitFor(() =>
    expect(mockSetUser).toHaveBeenCalledWith({ id: "1", token: "t" }),
  );
  expect(mockHydrateClientSessionState).toHaveBeenCalledWith({
    id: "1",
    token: "t",
  });
  expect(mockNavigate).toHaveBeenCalledWith("/");
});
