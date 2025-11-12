import PropTypes from "prop-types";

import AccountSectionView from "./AccountSection/AccountSectionView.jsx";
import { createAccountSectionViewModel } from "./AccountSection/viewModel";
import { useAvatarInteraction } from "./useAvatarInteraction.js";
import { useNormalizedIdentity } from "./useNormalizedIdentity.js";

function AccountSectionContainer({
  title,
  fields,
  headingId,
  identity,
  bindings,
}) {
  const avatarInteraction = useAvatarInteraction(identity);
  const normalizedIdentity = useNormalizedIdentity(identity, title);
  const viewModel = createAccountSectionViewModel({
    title,
    headingId,
    fields,
    bindings,
    identity: normalizedIdentity,
    avatarInteraction,
  });
  return <AccountSectionView {...viewModel} />;
}

AccountSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      renderValue: PropTypes.func,
      type: PropTypes.string,
      readOnlyInputProps: PropTypes.shape({
        type: PropTypes.string,
        inputMode: PropTypes.string,
        autoComplete: PropTypes.string,
        name: PropTypes.string,
        placeholder: PropTypes.string,
      }),
      usernameEditorProps: PropTypes.shape({
        username: PropTypes.string,
        emptyDisplayValue: PropTypes.string,
        onSubmit: PropTypes.func,
        onSuccess: PropTypes.func,
        onFailure: PropTypes.func,
        t: PropTypes.func,
        inputClassName: PropTypes.string,
      }),
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        onClick: PropTypes.func,
        isPending: PropTypes.bool,
        pendingLabel: PropTypes.string,
      }),
    }),
  ).isRequired,
  headingId: PropTypes.string.isRequired,
  identity: PropTypes.shape({
    label: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    changeLabel: PropTypes.string.isRequired,
    avatarAlt: PropTypes.string,
    onSelectAvatar: PropTypes.func,
    isUploading: PropTypes.bool,
  }).isRequired,
  bindings: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        actionLabel: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
};

export default AccountSectionContainer;
