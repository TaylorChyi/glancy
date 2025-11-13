import PropTypes from "prop-types";
import Layout from "@shared/components/Layout";
import ReportIssuePanel from "./panels/ReportIssuePanel.jsx";
import FeedbackHub from "@shared/components/ui/FeedbackHub";
import DictionaryMainContent from "./parts/DictionaryMainContent.jsx";
import DictionaryBottomPanel from "./parts/bottom-panel/DictionaryBottomPanel.jsx";

function DictionaryExperienceShellView({
  layout,
  displayClassName,
  mainContent,
  bottomPanel,
  reportPanel,
  feedbackHub,
}) {
  return (
    <>
      <Layout
        sidebarProps={layout.sidebarProps}
        onMainMiddleScroll={layout.onMainMiddleScroll}
        bottomContent={
          bottomPanel.shouldRender ? (
            <DictionaryBottomPanel {...bottomPanel.props} />
          ) : null
        }
      >
        <div className={displayClassName}>
          <DictionaryMainContent {...mainContent} />
        </div>
      </Layout>
      <ReportIssuePanel {...reportPanel} />
      <FeedbackHub {...feedbackHub} />
    </>
  );
}

DictionaryExperienceShellView.propTypes = {
  layout: PropTypes.shape({
    sidebarProps: PropTypes.shape({}).isRequired,
    onMainMiddleScroll: PropTypes.func,
  }).isRequired,
  displayClassName: PropTypes.string.isRequired,
  mainContent: PropTypes.shape({}).isRequired,
  bottomPanel: PropTypes.shape({
    shouldRender: PropTypes.bool.isRequired,
    props: PropTypes.shape({}).isRequired,
  }).isRequired,
  reportPanel: PropTypes.shape({}).isRequired,
  feedbackHub: PropTypes.shape({}).isRequired,
};

export default DictionaryExperienceShellView;
