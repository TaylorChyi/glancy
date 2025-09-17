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
    t: {
      continueButton: "Continue",
      invalidAccount: "Invalid account",
      loginButton: "Log in",
      registerButton: "Sign up",
      or: "OR",
      otherLoginOptions: "Other login options",
      notImplementedYet: "Not implemented yet",
      termsOfUse: "Terms of Use",
      privacyPolicy: "Privacy Policy",
    },
  }),
}));

const iconRegistry = {
  "glancy-web": {
    light: "/assets/glancy-web-light.svg",
    dark: "/assets/glancy-web-dark.svg",
  },
  user: { single: "/assets/user.svg" },
  email: { single: "/assets/email.svg" },
  phone: { single: "/assets/phone.svg" },
  wechat: { single: "/assets/wechat.svg" },
  apple: { single: "/assets/apple.svg" },
  google: { single: "/assets/google.svg" },
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
          formMethods={["username", "wechat"]}
          methodOrder={["username", "wechat"]}
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
    expect(screen.getByAltText("glancy-web")).toHaveAttribute(
      "src",
      iconRegistry["glancy-web"].light,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  /**
   * Ensures the username method is selected by default whenever it is
   * part of the available methods, even if other methods precede it or
   * are flagged as preferred defaults.
   */
  test("prioritizes username method when available", () => {
    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={jest.fn()}
          placeholders={{
            username: "Username",
            email: "Email",
            phone: "Phone",
          }}
          formMethods={["email", "username", "phone"]}
          methodOrder={["username", "email", "phone"]}
          defaultMethod="email"
        />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Email")).not.toBeInTheDocument();
  });

  /**
   * Validates that when the username method is absent, the component
   * respects the configured default while still falling back to the
   * first available method if the preferred default is unsupported.
   */
  test("falls back to first method when username is unavailable", () => {
    render(
      <MemoryRouter>
        <AuthForm
          title="Login"
          switchText="Have account?"
          switchLink="/register"
          onSubmit={jest.fn()}
          placeholders={{
            email: "Email",
            phone: "Phone",
          }}
          formMethods={["email", "phone"]}
          methodOrder={["email", "phone"]}
          defaultMethod="username"
        />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
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
          formMethods={["username", "wechat"]}
          methodOrder={["username", "wechat"]}
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
          formMethods={["username", "wechat"]}
          methodOrder={["username", "wechat"]}
        />
      </MemoryRouter>,
    );
    const title = container.querySelector("h1");
    expect(title.innerHTML).toBe("Welcome<br>Back");
  });
});
