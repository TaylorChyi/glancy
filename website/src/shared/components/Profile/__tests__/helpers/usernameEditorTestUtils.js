/* eslint-env jest */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UsernameEditor from "@shared/components/Profile/UsernameEditor";
import styles from "@shared/components/Profile/UsernameEditor/UsernameEditor.module.css";

export const translations = {
  usernamePlaceholder: "Enter username",
  changeUsernameButton: "Change username",
  saveUsernameButton: "Save username",
  saving: "Saving...",
  usernameValidationEmpty: "Username is required",
  usernameValidationTooShort: "Username must be at least {{min}} characters",
  usernameValidationTooLong: "Username must be at most {{max}} characters",
  usernameUpdateFailed: "Unable to update username",
  usernameUpdateSuccess: "Username updated successfully",
};

export function renderEditor(props = {}) {
  return render(
    <UsernameEditor
      username="taylor"
      emptyDisplayValue="Not set"
      t={translations}
      {...props}
    />,
  );
}

export function openEditor() {
  fireEvent.click(
    screen.getByRole("button", { name: translations.changeUsernameButton }),
  );
  return screen.getByPlaceholderText(translations.usernamePlaceholder);
}

export function saveDraft(value) {
  const input = screen.getByPlaceholderText(translations.usernamePlaceholder);
  fireEvent.change(input, { target: { value } });
  fireEvent.click(
    screen.getByRole("button", { name: translations.saveUsernameButton }),
  );
  return input;
}

export function expectValidationError(messageFragment) {
  const error = screen.getByText(messageFragment);
  expect(error).toBeInTheDocument();
  return error;
}

export { styles };
