import PropTypes from "prop-types";
import ResponseStyleSectionView from "./ResponseStyleSection/ResponseStyleSectionView.jsx";
import { createResponseStyleSectionViewModel } from "./ResponseStyleSection/viewModel";
import { useResponseStyleSectionDescription } from "./ResponseStyleSection/useResponseStyleSectionDescription.js";
import { useResponseStyleSectionHandlers } from "./ResponseStyleSection/useResponseStyleSectionHandlers.js";
import { normalizeResponseStyleState } from "./ResponseStyleSection/normalizeResponseStyleState.js";

const ResponseOptionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

const ResponseFieldShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
});

function ResponseStyleSection({
  title,
  message,
  headingId,
  descriptionId,
  state,
  copy,
  onRetry,
  onFieldChange,
  onFieldCommit,
}) {
  const { description, descriptionId: resolvedDescriptionId } =
    useResponseStyleSectionDescription({ message, descriptionId });
  const handlers = useResponseStyleSectionHandlers({
    onRetry,
    onFieldChange,
    onFieldCommit,
  });

  const viewModel = createResponseStyleSectionViewModel({
    title,
    headingId,
    description,
    descriptionId: resolvedDescriptionId,
    state: normalizeResponseStyleState(state, copy.errorLabel),
    copy,
    handlers,
  });

  return <ResponseStyleSectionView {...viewModel} />;
}

ResponseStyleSection.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
  state: PropTypes.shape({
    status: PropTypes.string.isRequired,
    values: PropTypes.object.isRequired,
    persisted: PropTypes.object.isRequired,
    savingField: PropTypes.string,
    error: PropTypes.any,
  }).isRequired,
  copy: PropTypes.shape({
    loadingLabel: PropTypes.string.isRequired,
    savingLabel: PropTypes.string.isRequired,
    errorLabel: PropTypes.string.isRequired,
    retryLabel: PropTypes.string.isRequired,
    dropdownLabel: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(ResponseOptionShape).isRequired,
    fields: PropTypes.arrayOf(ResponseFieldShape).isRequired,
  }).isRequired,
  onRetry: PropTypes.func,
  onFieldChange: PropTypes.func,
  onFieldCommit: PropTypes.func,
};

ResponseStyleSection.defaultProps = {
  message: "",
  descriptionId: undefined,
  onRetry: undefined,
  onFieldChange: undefined,
  onFieldCommit: undefined,
};

export default ResponseStyleSection;
