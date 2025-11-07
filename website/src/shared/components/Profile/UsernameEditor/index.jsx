import PropTypes from "prop-types";
import useUsernameEditorController from "./useUsernameEditorController.js";

function UsernameEditor(props) {
  const {
    layout,
    inputProps,
    buttonProps,
    buttonLabel,
    shouldRenderButton,
    errorProps,
  } = useUsernameEditorController(props);

  return (
    <div className={layout.container}>
      <div className={layout.controls}>
        <input {...inputProps} />
        {shouldRenderButton ? (
          <button {...buttonProps}>{buttonLabel}</button>
        ) : null}
      </div>
      {errorProps ? (
        <p
          className={errorProps.className}
          id={errorProps.id}
          role={errorProps.role}
        >
          {errorProps.message}
        </p>
      ) : null}
    </div>
  );
}

UsernameEditor.propTypes = {
  username: PropTypes.string,
  emptyDisplayValue: PropTypes.string,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  onSubmit: PropTypes.func,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  renderInlineAction: PropTypes.bool,
  onResolveAction: PropTypes.func,
  t: PropTypes.shape({
    usernamePlaceholder: PropTypes.string.isRequired,
    changeUsernameButton: PropTypes.string.isRequired,
    saveUsernameButton: PropTypes.string.isRequired,
    saving: PropTypes.string.isRequired,
    usernameValidationEmpty: PropTypes.string.isRequired,
    usernameValidationTooShort: PropTypes.string.isRequired,
    usernameValidationTooLong: PropTypes.string.isRequired,
    usernameUpdateFailed: PropTypes.string.isRequired,
  }).isRequired,
};

UsernameEditor.defaultProps = {
  renderInlineAction: true,
  onResolveAction: undefined,
};

export default UsernameEditor;
