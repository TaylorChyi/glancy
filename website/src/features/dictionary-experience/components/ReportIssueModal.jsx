import PropTypes from "prop-types";
import BaseModal from "@shared/components/modals/BaseModal.jsx";
import ReportIssueForm from "./ReportIssueForm.jsx";
import { useReportIssueModalViewModel } from "./useReportIssueModalViewModel";


function ReportIssueModal(props) {
  const viewModel = useReportIssueModalViewModel(props);

  return (
    <BaseModal
      open={props.open}
      onClose={viewModel.handleClose}
      className={viewModel.modalClassName}
      hideDefaultCloseButton
      ariaLabelledBy={viewModel.headingId}
    >
      <ReportIssueForm {...viewModel} />
    </BaseModal>
  );
}

ReportIssueModal.propTypes = {
  open: PropTypes.bool.isRequired,
  term: PropTypes.string.isRequired,
  language: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  flavor: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  sourceLanguage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
  targetLanguage: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf([null]),
  ]),
  category: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      labelKey: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  description: PropTypes.string.isRequired,
  submitting: PropTypes.bool,
  error: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ReportIssueModal.defaultProps = {
  submitting: false,
  error: "",
  language: null,
  flavor: null,
  sourceLanguage: null,
  targetLanguage: null,
};

export default ReportIssueModal;
