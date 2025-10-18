import PropTypes from "prop-types";
import BaseModal from "@shared/components/modals/BaseModal.jsx";
import ReportIssueForm from "./ReportIssueForm.jsx";
import { useReportIssueModalViewModel } from "./useReportIssueModalViewModel";

/**
 * 背景：
 *  - 举报弹窗需复用 SettingsSurface 的视觉语言，以保持界面一致性；
 *  - 结构化 lint 限制促使我们拆分派生逻辑与 UI 结构。
 * 目的：
 *  - 通过 ViewModel + 子组件的组合，保持弹窗职责单一且可测试。
 * 关键决策与取舍：
 *  - 使用自定义 Hook 承载派生状态，UI 只负责装配；
 *  - 将操作区、摘要区拆分为独立组件，减少主组件行数并提升复用性。
 */
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
