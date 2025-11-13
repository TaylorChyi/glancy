import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const resolveTooShortMessage = (translations) =>
  translations.usernameValidationTooShort?.replace("{{min}}", "3") ??
  "Username must be at least 3 characters";

const getInputValue = ({ mode, draft, emptyDisplayValue }) => {
  if (mode !== "view") {
    return draft;
  }

  if (!draft || !draft.trim()) {
    return emptyDisplayValue ?? "";
  }

  return draft;
};

const useUsernameDraft = (username) => {
  const [mode, setMode] = useState("view");
  const [draft, setDraft] = useState(username ?? "");
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(username ?? "");
    setError(null);
  }, [username]);

  return {
    mode,
    draft,
    error,
    setDraft,
    setError,
    enterEditMode: () => setMode("edit"),
    exitEditMode: () => setMode("view"),
  };
};

const submitDraft = async ({ draft, onSubmit, setDraft, setError, exitEditMode, t }) => {
  const normalized = draft.trim();
  if (normalized.length < 3) {
    setError(resolveTooShortMessage(t));
    return;
  }

  await onSubmit?.(normalized);
  setDraft(normalized);
  setError(null);
  exitEditMode();
};

const createButtonHandler = (params) => async () => {
  if (params.mode === "view") {
    params.enterEditMode();
    return;
  }

  await submitDraft(params);
};

const buildInputProps = ({
  mode,
  draft,
  emptyDisplayValue,
  setDraft,
  t,
  error,
}) => ({
  placeholder: t.usernamePlaceholder,
  value: getInputValue({ mode, draft, emptyDisplayValue }),
  disabled: mode === "view",
  ["aria-invalid"]: error ? "true" : "false",
  onChange: (event) => setDraft(event.target.value),
});

const renderError = (error) =>
  error ? (
    <p role="alert" className="error">
      {error}
    </p>
  ) : null;

const renderMockUsernameEditor = (params) => (
  <div>
    <input {...buildInputProps(params)} />
    <button type="button" onClick={createButtonHandler(params)}>
      {params.mode === "view"
        ? params.t.changeUsernameButton
        : params.t.saveUsernameButton}
    </button>
    {renderError(params.error)}
  </div>
);

/**
 * Lightweight mock of UsernameEditor used by preference tests to avoid
 * depending on the actual component styles and side effects.
 */
export function MockUsernameEditor({ username, emptyDisplayValue, t, onSubmit }) {
  const state = useUsernameDraft(username);

  return renderMockUsernameEditor({
    ...state,
    emptyDisplayValue,
    t,
    onSubmit,
  });
}

MockUsernameEditor.propTypes = {
  username: PropTypes.string,
  emptyDisplayValue: PropTypes.string,
  t: PropTypes.shape({
    usernamePlaceholder: PropTypes.string.isRequired,
    changeUsernameButton: PropTypes.string.isRequired,
    saveUsernameButton: PropTypes.string.isRequired,
    usernameValidationTooShort: PropTypes.string,
  }).isRequired,
  onSubmit: PropTypes.func,
};
