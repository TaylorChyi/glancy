import PropTypes from "prop-types";
import GeneralSectionView from "./GeneralSection/GeneralSectionView.jsx";
import { useGeneralSectionViewModel } from "./GeneralSection/useGeneralSectionViewModel.js";

function GeneralSectionContainer({ title, headingId }) {
  const viewModel = useGeneralSectionViewModel({ title, headingId });
  return <GeneralSectionView {...viewModel} />;
}

GeneralSectionContainer.propTypes = {
  title: PropTypes.string.isRequired,
  headingId: PropTypes.string.isRequired,
};

export default GeneralSectionContainer;
