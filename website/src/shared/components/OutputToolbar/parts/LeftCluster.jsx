import PropTypes from "prop-types";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "../OutputToolbar.module.css";

const TtsControl = ({ showTts, ttsComponent, term, lang, speakableTerm }) => {
  if (!showTts) {
    return null;
  }

  const TtsComponent = ttsComponent;
  return (
    <TtsComponent
      text={term}
      lang={lang}
      size={20}
      disabled={!speakableTerm}
    />
  );
};

const ReplayControl = ({
  showReplay,
  baseToolButtonClass,
  onReoutput,
  disabled,
  speakableTerm,
  reoutputLabel,
}) => {
  if (!showReplay) {
    return null;
  }

  return (
    <button
      type="button"
      className={`${baseToolButtonClass} ${styles["tool-button-replay"]}`}
      onClick={onReoutput}
      disabled={disabled || !speakableTerm}
      aria-label={reoutputLabel}
    >
      <ThemeIcon name="refresh" width={16} height={16} aria-hidden="true" />
    </button>
  );
};

function LeftCluster(props) {
  const { showTts, showReplay } = props;

  if (!showTts && !showReplay) {
    return null;
  }

  return (
    <div className={styles["left-cluster"]}>
      <TtsControl {...props} />
      <ReplayControl {...props} />
    </div>
  );
}

LeftCluster.propTypes = {
  showTts: PropTypes.bool.isRequired,
  showReplay: PropTypes.bool.isRequired,
  ttsComponent: PropTypes.elementType.isRequired,
  term: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  speakableTerm: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
    .isRequired,
  disabled: PropTypes.bool.isRequired,
  onReoutput: PropTypes.func,
  baseToolButtonClass: PropTypes.string.isRequired,
  reoutputLabel: PropTypes.string.isRequired,
};

LeftCluster.defaultProps = {
  onReoutput: undefined,
};

export default LeftCluster;
