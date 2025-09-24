/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { API_PATHS } from "@/config/api.js";

const mockSetUser = jest.fn();
const mockRequest = jest
  .fn()
  .mockResolvedValueOnce(undefined)
  .mockResolvedValueOnce({ id: "1", token: "t" });
const mockNavigate = jest.fn();

jest.unstable_mockModule("@/context", () => ({
  useUser: () => ({ setUser: mockSetUser }),
}));
jest.unstable_mockModule("@/hooks", () => ({
  useApi: () => ({ request: mockRequest }),
}));
jest.unstable_mockModule("@/context", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
jest.unstable_mockModule("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const router = await import("react-router-dom");
const { MemoryRouter } = router;
const { default: Register } = await import("@/pages/auth/Register");

test("registers and logs in user", async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByPlaceholderText("Phone number"), {
    target: { value: "1234567" },
  });
  fireEvent.change(screen.getByPlaceholderText("Code"), {
    target: { value: "0000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));
  expect(mockRequest.mock.calls[0][0]).toBe(API_PATHS.register);
  expect(mockRequest.mock.calls[1][0]).toBe(API_PATHS.login);
  await waitFor(() =>
    expect(mockSetUser).toHaveBeenCalledWith({ id: "1", token: "t" }),
  );
  expect(mockNavigate).toHaveBeenCalledWith("/");
});
