/* eslint-env jest */
import { render, screen } from "@testing-library/react";
import { jest } from "@jest/globals";

let currentTheme = "light";
const mockUseTheme = jest.fn(() => ({ resolvedTheme: currentTheme }));

jest.unstable_mockModule("@/context", () => ({
  useTheme: mockUseTheme,
}));

const iconRegistry = {
  "glancy-web": {
    light: "/assets/glancy-web-light.svg",
    dark: "/assets/glancy-web-dark.svg",
  },
  wechat: {
    single: "/assets/wechat.svg",
  },
};

jest.unstable_mockModule("@/assets/icons.js", () => ({
  default: iconRegistry,
}));

const { ThemeIcon } = await import("@/components/ui/Icon/index.jsx");

describe("ThemeIcon", () => {
  beforeEach(() => {
    currentTheme = "light";
    mockUseTheme.mockReset();
    mockUseTheme.mockImplementation(() => ({ resolvedTheme: currentTheme }));
  });

  /**
   * Ensures the component selects the light-themed asset when the
   * resolved theme originates from a light context.
   */
  test("renders light variant when theme is light", () => {
    currentTheme = "light";
    render(<ThemeIcon name="glancy-web" alt="brand" />);
    expect(screen.getByRole("img", { name: "brand" })).toHaveAttribute(
      "src",
      iconRegistry["glancy-web"].light,
    );
  });

  /**
   * Validates that the dark variant is loaded whenever the theme
   * resolves to a dark palette, guaranteeing icon legibility.
   */
  test("renders dark variant when theme is dark", () => {
    currentTheme = "dark";
    render(<ThemeIcon name="glancy-web" alt="brand" />);
    expect(screen.getByRole("img", { name: "brand" })).toHaveAttribute(
      "src",
      iconRegistry["glancy-web"].dark,
    );
  });

  /**
   * Confirms that single-variant icons are still rendered even when
   * theme-specific variants are unavailable in the registry.
   */
  test("falls back to single variant when dedicated theme assets are missing", () => {
    currentTheme = "dark";
    render(<ThemeIcon name="wechat" alt="wechat" />);
    expect(screen.getByRole("img", { name: "wechat" })).toHaveAttribute(
      "src",
      iconRegistry.wechat.single,
    );
  });

  /**
   * Provides a graceful typographic badge whenever the requested icon
   * is absent from the registry, ensuring the UI never collapses.
   */
  test("renders typographic fallback when icon registry entry is missing", () => {
    render(<ThemeIcon name="google" alt="google" />);
    const fallback = screen.getByRole("img", { name: "google" });
    expect(fallback).toHaveTextContent("G");
  });
});
