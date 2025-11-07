import { memo } from "react";
import PropTypes from "prop-types";
import styles from "./LibraryLandingView.module.css";

function LibraryLandingView({ label }) {
  return (
    <section className={styles.root} aria-labelledby="library-landing-label">
      <span id="library-landing-label" className={styles.label}>
        {label}
      </span>
    </section>
  );
}

LibraryLandingView.propTypes = {
  label: PropTypes.string,
};

LibraryLandingView.defaultProps = {
  label: "致用单词",
};

export default memo(LibraryLandingView);
