/* eslint-env jest */
import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import { renderAuthForm } from "./fixtures/authFormFixtures.js";

const renderBrandTests = () => {
  test("renders brand logo using inline asset", async () => {
    await renderAuthForm();

    expect(screen.getByRole("img", { name: "Glancy" }).innerHTML).toContain(
      "glancy-light",
    );
  });

  test("matches snapshot for default login view", async () => {
    const { asFragment } = await renderAuthForm();

    expect(asFragment()).toMatchSnapshot();
  });
};

const renderCredentialTests = () => {
  test("submits provided credentials with username method", async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    await renderAuthForm({ onSubmit: handleSubmit });

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
  });

  test("renders custom alternative option label when provided", async () => {
    await renderAuthForm({
      title: "Register",
      switchText: "Back to login?",
      switchLink: "/login",
      otherOptionsLabel: "Other register options",
    });

    expect(
      screen.getByRole("separator", { name: "Other register options" }),
    ).toBeInTheDocument();
  });
};

const renderVerificationTests = () => {
  test("requests verification code for email method", async () => {
    const handleRequestCode = jest.fn().mockResolvedValue(undefined);
    await renderAuthForm({
      placeholders: { email: "Email" },
      formMethods: ["email"],
      methodOrder: ["email"],
      defaultMethod: "email",
      showCodeButton: () => true,
      onRequestCode: handleRequestCode,
    });

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

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(
      "Verification code sent. Please check your inbox.",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  test("surfaces validation errors when account is invalid", async () => {
    const validateAccount = () => false;
    await renderAuthForm({ validateAccount });

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Invalid account")).toBeInTheDocument();
  });
};

const renderFallbackTests = () => {
  test("renders multi-line title with explicit breaks", async () => {
    const { container } = await renderAuthForm({ title: "Welcome\nBack" });

    const title = container.querySelector("h1");
    expect(title.innerHTML).toBe("Welcome<br>Back");
  });

  test("falls back to configured default when username is unavailable", async () => {
    await renderAuthForm({
      placeholders: { email: "Email" },
      formMethods: ["phone", "email"],
      methodOrder: ["phone", "email"],
      defaultMethod: "email",
    });

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });
};

describe("AuthForm", () => {
  renderBrandTests();
  renderCredentialTests();
  renderVerificationTests();
  renderFallbackTests();
});
