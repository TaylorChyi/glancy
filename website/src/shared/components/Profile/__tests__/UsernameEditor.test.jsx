/* eslint-env jest */
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { jest } from "@jest/globals";
import {
  translations as t,
  renderEditor,
  openEditor,
  saveDraft,
  expectValidationError,
  styles,
} from "./helpers/usernameEditorTestUtils.js";

function getTriggerButton() {
  return screen.getByRole("button", { name: t.changeUsernameButton });
}

describe("UsernameEditor edit flow", () => {
  test("GivenViewMode_WhenSavingDraft_ThenSubmitAndReturnToView", async () => {
    const handleSubmit = jest.fn().mockResolvedValue("taylor.glancy");
    renderEditor({ onSubmit: handleSubmit });

    const input = screen.getByPlaceholderText(t.usernamePlaceholder);
    expect(input).toBeDisabled();
    expect(input).toHaveValue("taylor");

    openEditor();
    expect(input).not.toBeDisabled();

    saveDraft("  taylor.glancy  ");

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith("taylor.glancy");
      expect(getTriggerButton()).toBeInTheDocument();
    });
  });

  test("GivenUnchangedDraft_WhenSaving_ThenSkipSubmitAndResetView", () => {
    const handleSubmit = jest.fn();
    renderEditor({ onSubmit: handleSubmit });

    openEditor();
    saveDraft("taylor");

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(getTriggerButton()).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t.usernamePlaceholder)).toBeDisabled();
  });

  test("GivenEditTriggered_WhenEnteringEditMode_ThenFocusInput", async () => {
    renderEditor();

    const input = openEditor();
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(input).toHaveFocus();
    });
    expect(input).toHaveValue("taylor");
  });

  test("GivenUnchangedDraft_WhenBlurred_ThenRevertToViewMode", async () => {
    renderEditor();

    const input = openEditor();
    await waitFor(() => expect(input).not.toBeDisabled());

    fireEvent.blur(input);

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(getTriggerButton()).toBeInTheDocument();
    });
  });
});

describe("UsernameEditor validation", () => {
  test("GivenShortUsername_WhenSaving_ThenShowValidationError", async () => {
    const handleSubmit = jest.fn();
    renderEditor({ onSubmit: handleSubmit });

    openEditor();
    saveDraft("ab");

    expect(handleSubmit).not.toHaveBeenCalled();
    await waitFor(() => expectValidationError(/at least 3 characters/));
    const input = screen.getByPlaceholderText(t.usernamePlaceholder);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass(styles.input, styles["input-invalid"]);
  });

  test("GivenServerError_WhenSubmitFails_ThenSurfaceMessage", async () => {
    const handleSubmit = jest
      .fn()
      .mockRejectedValue(new Error("用户名已存在"));
    renderEditor({ onSubmit: handleSubmit });

    openEditor();
    saveDraft("glancy");

    await waitFor(() => expectValidationError("用户名已存在"));
    const input = screen.getByPlaceholderText(t.usernamePlaceholder);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass(styles.input, styles["input-invalid"]);
  });
});

describe("UsernameEditor display state", () => {
  test("GivenEmptyUsername_WhenViewing_ThenShowPlaceholderAndClearDraft", () => {
    renderEditor({ username: "", onSubmit: jest.fn() });

    expect(screen.getByDisplayValue("Not set")).toBeDisabled();

    const input = openEditor();
    expect(input).toHaveValue("");
  });
});
