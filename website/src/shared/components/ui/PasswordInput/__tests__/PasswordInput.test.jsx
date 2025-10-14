/* eslint-env jest */
import { fireEvent, render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

let currentTheme = "light";
const mockUseTheme = jest.fn(() => ({ resolvedTheme: currentTheme }));

jest.unstable_mockModule("@core/context", () => ({
  useTheme: mockUseTheme,
}));

jest.unstable_mockModule("@assets/icons.js", () => ({
  default: {
    eye: {
      light: Object.freeze({
        url: null,
        inline: '<svg data-variant="eye-light"></svg>',
      }),
      dark: Object.freeze({
        url: null,
        inline: '<svg data-variant="eye-dark"></svg>',
      }),
    },
    "eye-off": {
      light: Object.freeze({
        url: null,
        inline: '<svg data-variant="eye-off-light"></svg>',
      }),
      dark: Object.freeze({
        url: null,
        inline: '<svg data-variant="eye-off-dark"></svg>',
      }),
    },
  },
}));

const { default: PasswordInput } = await import(
  "@shared/components/ui/PasswordInput/index.jsx"
);

describe("PasswordInput", () => {
  beforeEach(() => {
    currentTheme = "light";
    mockUseTheme.mockClear();
    mockUseTheme.mockImplementation(() => ({ resolvedTheme: currentTheme }));
  });

  /**
   * Validates that toggling the action button transitions the
   * input between masked and plain text states while updating
   * the pressed status for accessibility tooling.
   */
  test("toggles visibility state", () => {
    render(
      <PasswordInput
        value="secret"
        onChange={() => {}}
        placeholder="Password"
      />,
    );

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "text",
    );
    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(
      screen.getByRole("button", { name: "Show password" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  /**
   * Ensures that the rendered icon responds to both theme changes
   * and visibility toggles so the imagery stays consistent with
   * the current context.
   */
  test("switches icons across themes", () => {
    const { rerender } = render(
      <PasswordInput
        value="secret"
        onChange={() => {}}
        placeholder="Password"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Show password" }).innerHTML,
    ).toContain("eye-light");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(
      screen.getByRole("img", { name: "Hide password" }).innerHTML,
    ).toContain("eye-off-light");

    currentTheme = "dark";
    rerender(
      <PasswordInput
        value="secret"
        onChange={() => {}}
        placeholder="Password"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Hide password" }).innerHTML,
    ).toContain("eye-off-dark");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(
      screen.getByRole("img", { name: "Show password" }).innerHTML,
    ).toContain("eye-dark");
  });
});
