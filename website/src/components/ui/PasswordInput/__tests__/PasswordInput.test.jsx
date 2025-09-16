/* eslint-env jest */
import { fireEvent, render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

let currentTheme = "light";
const mockUseTheme = jest.fn(() => ({ resolvedTheme: currentTheme }));

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: {
    eye: {
      light: "eye-light.svg",
      dark: "eye-dark.svg",
    },
    "eye-off": {
      light: "eye-off-light.svg",
      dark: "eye-off-dark.svg",
    },
  },
}));

const { default: PasswordInput } = await import(
  "@/components/ui/PasswordInput/index.jsx"
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

    expect(screen.getByRole("img", { name: "Show password" })).toHaveAttribute(
      "src",
      "eye-light.svg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByRole("img", { name: "Hide password" })).toHaveAttribute(
      "src",
      "eye-off-light.svg",
    );

    currentTheme = "dark";
    rerender(
      <PasswordInput
        value="secret"
        onChange={() => {}}
        placeholder="Password"
      />,
    );

    expect(screen.getByRole("img", { name: "Hide password" })).toHaveAttribute(
      "src",
      "eye-off-dark.svg",
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));

    expect(screen.getByRole("img", { name: "Show password" })).toHaveAttribute(
      "src",
      "eye-dark.svg",
    );
  });
});
