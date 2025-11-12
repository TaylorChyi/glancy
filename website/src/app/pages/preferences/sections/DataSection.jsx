import PropTypes from "prop-types";
import DataSectionView from "./DataSection/DataSectionView.jsx";
import { createDataSectionViewModel } from "./DataSection/viewModel";
import { useDataSectionController } from "./useDataSectionController.js";

function DataSectionContainer({ title, message, headingId, descriptionId }) {
  const controller = useDataSectionController({ message, descriptionId });
  const viewModel = createDataSectionViewModel({
    title,
    headingId,
    description: controller.description,
    ids: controller.ids,
    copy: controller.copy,
    historyToggle: controller.historyToggle,
    retentionControl: controller.retentionControl,
    languageControl: controller.languageControl,
    actionsControl: controller.actionsControl,
    isActionPending: controller.isActionPending,
  });

  return <DataSectionView {...viewModel} />;
}

DataSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  headingId: PropTypes.string.isRequired,
  descriptionId: PropTypes.string,
};

DataSectionContainer.defaultProps = {
  message: "",
  descriptionId: undefined,
};

export default DataSectionContainer;
