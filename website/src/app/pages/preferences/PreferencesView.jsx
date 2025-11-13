import PropTypes from "prop-types";
import AvatarEditorModal from "@shared/components/AvatarEditorModal";
import PreferencesForm from "./parts/PreferencesForm.jsx";
import RedeemToast from "./parts/RedeemToast.jsx";
import styles from "./Preferences.module.css";

function PreferencesView({ form, header, viewport, activeSection, avatarEditor, toast }) {
  return (
    <>
      <div className={styles.content}>
        <PreferencesForm
          form={form}
          header={header}
          viewport={viewport}
          activeSection={activeSection}
        />
        {avatarEditor ? <AvatarEditorModal {...avatarEditor} /> : null}
      </div>
      <RedeemToast toast={toast} />
    </>
  );
}

PreferencesView.propTypes = {
  form: PropTypes.shape({
    ariaHeadingId: PropTypes.string.isRequired,
    ariaDescriptionId: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
  header: PropTypes.shape({}).isRequired,
  viewport: PropTypes.shape({}).isRequired,
  activeSection: PropTypes.shape({
    Component: PropTypes.elementType,
    props: PropTypes.shape({}),
  }),
  avatarEditor: PropTypes.shape({}),
  toast: PropTypes.shape({}),
};

PreferencesView.defaultProps = {
  activeSection: undefined,
  avatarEditor: undefined,
  toast: undefined,
};

export default PreferencesView;
