import PropTypes from "prop-types";

import AccountSectionView from "./AccountSection/AccountSectionView.jsx";
import { createAccountSectionViewModel } from "./AccountSection/viewModel";
import { useAvatarInteraction } from "./useAvatarInteraction.js";
import { useNormalizedIdentity } from "./useNormalizedIdentity.js";
import {
  accountBindingsPropType,
  accountFieldsPropType,
} from "./AccountSection/propTypes.js";

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
  fields: accountFieldsPropType,
  headingId: PropTypes.string.isRequired,
  identity: PropTypes.shape({
    label: PropTypes.string,
    displayName: PropTypes.string.isRequired,
    changeLabel: PropTypes.string.isRequired,
    avatarAlt: PropTypes.string,
    onSelectAvatar: PropTypes.func,
    isUploading: PropTypes.bool,
  }).isRequired,
  bindings: accountBindingsPropType,
};

export default AccountSectionContainer;
