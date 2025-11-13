import PropTypes from "prop-types";
import { Section } from "./DictionarySections.jsx";
import styles from "./DictionaryEntry.module.css";
import { createStableKeyFactory } from "./stableKeyFactory.js";

export function VariantList({ label, variants }) {
  if (!variants.length) return null;
  const keyForVariant = createStableKeyFactory("variant");
  return (
    <Section id="var-title" label={label} className={styles.variants}>
      <ul>
        {variants.map((variant) => (
          <li key={keyForVariant([variant?.状态, variant?.词形])}>
            {variant.状态}：{variant.词形}
          </li>
        ))}
      </ul>
    </Section>
  );
}

VariantList.propTypes = {
  label: PropTypes.string.isRequired,
  variants: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export function PhraseList({ label, phrases }) {
  if (!phrases.length) return null;
  const keyForPhrase = createStableKeyFactory("phrase");
  return (
    <Section id="phr-title" label={label} className={styles.phrases}>
      <ul>
        {phrases.map((phrase) => (
          <li key={keyForPhrase(phrase)}>{phrase}</li>
        ))}
      </ul>
    </Section>
  );
}

PhraseList.propTypes = {
  label: PropTypes.string.isRequired,
  phrases: PropTypes.arrayOf(PropTypes.string).isRequired,
};
