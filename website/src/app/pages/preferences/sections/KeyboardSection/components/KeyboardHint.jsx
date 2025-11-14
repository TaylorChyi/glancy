import PropTypes from "prop-types";

import styles from "../KeyboardSection.module.css";

function KeyboardHint({ hint }) {
  return <div className={styles.hint}>{hint}</div>;
}

KeyboardHint.propTypes = {
  hint: PropTypes.string.isRequired,
};

export default KeyboardHint;
