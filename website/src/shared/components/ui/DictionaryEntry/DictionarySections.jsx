import PropTypes from "prop-types";
import styles from "./DictionaryEntry.module.css";

export function Section({ id, label, className, children }) {
  return (
    <section className={className} aria-labelledby={id}>
      <h2 id={id} className={styles["section-title"]}>
        {label}
      </h2>
      {children}
    </section>
  );
}

Section.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export function PhoneticSection({ label, text }) {
  if (!text) return null;
  return (
    <Section
      id="phon-title"
      label={label}
      className={styles["phonetic-section"]}
    >
      <p className={styles.phonetic}>{text}</p>
    </Section>
  );
}

PhoneticSection.propTypes = {
  label: PropTypes.string.isRequired,
  text: PropTypes.string,
};

PhoneticSection.defaultProps = {
  text: undefined,
};
