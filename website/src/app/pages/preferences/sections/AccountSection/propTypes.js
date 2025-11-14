import PropTypes from "prop-types";

const actionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  isPending: PropTypes.bool,
  pendingLabel: PropTypes.string,
});

const readOnlyInputPropsShape = PropTypes.shape({
  type: PropTypes.string,
  inputMode: PropTypes.string,
  autoComplete: PropTypes.string,
  name: PropTypes.string,
  placeholder: PropTypes.string,
});

const usernameEditorPropsShape = PropTypes.shape({
  username: PropTypes.string,
  emptyDisplayValue: PropTypes.string,
  onSubmit: PropTypes.func,
  onSuccess: PropTypes.func,
  onFailure: PropTypes.func,
  t: PropTypes.func,
  inputClassName: PropTypes.string,
});

const accountFieldShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  renderValue: PropTypes.func,
  type: PropTypes.string,
  readOnlyInputProps: readOnlyInputPropsShape,
  usernameEditorProps: usernameEditorPropsShape,
  action: actionShape,
});

export const accountFieldsPropType = PropTypes.arrayOf(accountFieldShape).isRequired;

const accountBindingItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
});

export const accountBindingsPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(accountBindingItemShape).isRequired,
}).isRequired;

export default {
  accountFieldsPropType,
  accountBindingsPropType,
};
