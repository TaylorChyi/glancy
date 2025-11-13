import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

/**
 * Lightweight mock of UsernameEditor used by preference tests to avoid
 * depending on the actual component styles and side effects.
 */
export function MockUsernameEditor({
  username,
  emptyDisplayValue,
  t,
  onSubmit,
}) {
  const [mode, setMode] = useState("view");
  const [draft, setDraft] = useState(username ?? "");
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft(username ?? "");
    setError(null);
  }, [username]);

  const displayValue =
    mode === "view" && (!draft || !draft.trim())
      ? emptyDisplayValue ?? ""
      : draft;

  const handleButtonClick = async () => {
    if (mode === "view") {
      setMode("edit");
      return;
    }

    const normalized = draft.trim();
    if (normalized.length < 3) {
      const fallback =
        t.usernameValidationTooShort?.replace("{{min}}", "3") ??
        "Username must be at least 3 characters";
      setError(fallback);
      return;
    }

    await onSubmit?.(normalized);
    setDraft(normalized);
    setError(null);
    setMode("view");
  };

  return (
    <div>
      <input
        placeholder={t.usernamePlaceholder}
        value={mode === "view" ? displayValue : draft}
        disabled={mode === "view"}
        aria-invalid={error ? "true" : "false"}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="button" onClick={handleButtonClick}>
        {mode === "view" ? t.changeUsernameButton : t.saveUsernameButton}
      </button>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
    </div>
  );
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
