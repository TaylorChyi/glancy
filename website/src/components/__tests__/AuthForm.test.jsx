/* eslint-env jest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { jest } from "@jest/globals";

jest.unstable_mockModule("@/context", () => ({
  // Provide minimal implementations for all hooks consumed by AuthForm
  useTheme: () => ({ resolvedTheme: "light" }),
  useLocale: () => ({ locale: "en-US" }),
  useApiContext: () => ({ request: async () => {} }),
  useLanguage: () => ({
    lang: "en",
    t: {
      continueButton: "Continue",
      invalidAccount: "Invalid account",
      loginButton: "Log in",
      registerButton: "Sign up",
      or: "OR",
      notImplementedYet: "Not implemented yet",
      termsOfUse: "Terms of Use",
      privacyPolicy: "Privacy Policy",
      otherLoginOptions: "Other login options",
      otherRegisterOptions: "Other register options",
      codeButtonLabel: "Get code",
      codeRequestSuccess: "Verification code sent. Please check your inbox.",
      codeRequestFailed: "Failed to send verification code",
      codeRequestInvalidMethod: "Unavailable",
    },
  }),
}));

const createDualVariant = (token) => ({
  light: {
    src: `/assets/${token}-light.svg`,
    content: `<svg data-icon="${token}-light"></svg>`,
  },
  dark: {
    src: `/assets/${token}-dark.svg`,
    content: `<svg data-icon="${token}-dark"></svg>`,
  },
});

const iconRegistry = {
  "glancy-web": createDualVariant("glancy-web"),
  user: createDualVariant("user"),
  email: createDualVariant("email"),
  phone: createDualVariant("phone"),
  wechat: createDualVariant("wechat"),
  apple: createDualVariant("apple"),
  google: createDualVariant("google"),
  eye: createDualVariant("eye"),
  "eye-off": createDualVariant("eye-off"),
};

jest.unstable_mockModule("@/assets/icons.js", () => ({
  // Bypass Vite-specific import.meta.glob during tests
  default: iconRegistry,
}));

const { default: AuthForm } = await import("@/components/form/AuthForm.jsx");

describe("AuthForm", () => {
  /**
   * Simulates a successful form submission and ensures the payload
   * matches the provided credentials while the UI renders as expected.
   */
  test("submits valid credentials", async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const { asFragment } = render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={handleSubmit}
          placeholders={{ username: "Username" }}
          formMethods={["wechat", "username"]}
          methodOrder={["username", "wechat"]}
          defaultMethod="username"
        />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "alice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith({
        account: "alice",
        password: "secret",
        method: "username",
      }),
    );
    const brandIcon = screen.getByRole("img", { name: "Glancy" });
    expect(brandIcon.innerHTML).toContain("data-icon=\"glancy-web-light\"");
    expect(asFragment()).toMatchSnapshot();
  });

  /**
   * Ensures the caller can override the default separator label, enabling
   * context-aware messaging between login and registration flows.
   */
  test("renders custom alternative option label when provided", () => {
    render(
      <MemoryRouter>
        <AuthForm
          title="Register"
          switchText="Back to login?"
          switchLink="/login"
          onSubmit={jest.fn()}
          placeholders={{ username: "Username" }}
          formMethods={["username", "wechat"]}
          methodOrder={["username", "wechat"]}
          defaultMethod="username"
          otherOptionsLabel="Other register options"
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("separator", { name: "Other register options" }),
    ).toBeInTheDocument();
  });

  /**
   * Verifies that requesting a verification code triggers the supplied
   * handler and surfaces the success message to the user.
   */
  test("requests verification code for email method", async () => {
    const handleRequestCode = jest.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={jest.fn()}
          placeholders={{ email: "Email" }}
          formMethods={["email"]}
          methodOrder={["email"]}
          defaultMethod="email"
          showCodeButton={() => true}
          onRequestCode={handleRequestCode}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Get code" }));

    await waitFor(() =>
      expect(handleRequestCode).toHaveBeenCalledWith({
        account: "user@example.com",
        method: "email",
      }),
    );

    expect(
      await screen.findByText(
        "Verification code sent. Please check your inbox.",
      ),
    ).toBeInTheDocument();
  });

  /**
   * Triggers validation failure and verifies that the appropriate
   * error message is presented to the user.
   */
  test("shows error when validation fails", async () => {
    const handleSubmit = jest.fn();
    const validateAccount = () => false;
    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={handleSubmit}
          placeholders={{ username: "Username" }}
          formMethods={["wechat", "username"]}
          methodOrder={["username", "wechat"]}
          defaultMethod="username"
          validateAccount={validateAccount}
        />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Invalid account")).toBeInTheDocument();
  });

  /**
   * Ensures that newline characters within the title are rendered
   * as explicit line breaks for better readability.
   */
  test("renders multi-line title correctly", () => {
    const { container } = render(
      <MemoryRouter>
        <AuthForm
          title={"Welcome\nBack"}
          switchText="Have account?"
          switchLink="/register"
          onSubmit={jest.fn()}
          placeholders={{ username: "Username" }}
          formMethods={["wechat", "username"]}
          methodOrder={["username", "wechat"]}
          defaultMethod="username"
        />
      </MemoryRouter>,
    );
    const title = container.querySelector("h1");
    expect(title.innerHTML).toBe("Welcome<br>Back");
  });

  /**
   * Validates that a provided default method is respected when username
   * authentication is unavailable, preventing regressions for legacy flows.
   */
  test("falls back to configured default when username is unavailable", () => {
    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={jest.fn()}
          placeholders={{ email: "Email" }}
          formMethods={["phone", "email"]}
          methodOrder={["phone", "email"]}
          defaultMethod="email"
        />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });
});
