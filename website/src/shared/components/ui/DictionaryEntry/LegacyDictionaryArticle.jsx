import PropTypes from "prop-types";
import { TtsButton } from "@shared/components";
import DictionaryMarkdown from "./DictionaryMarkdown.jsx";
import styles from "./DictionaryEntry.module.css";
import { Section, PhoneticSection } from "./DictionarySections.jsx";

function LegacyDefinitions({ label, definitions }) {
  if (!definitions?.length) {
    return <p className={styles["no-definition"]}>{label}</p>;
  }

  return (
    <Section id="def-title" label={label} className={styles.definitions}>
      <ol>
        {definitions.map((definition, index) => (
          <li key={index}>
            <DictionaryMarkdown>{definition}</DictionaryMarkdown>
          </li>
        ))}
      </ol>
    </Section>
  );
}

LegacyDefinitions.propTypes = {
  label: PropTypes.string.isRequired,
  definitions: PropTypes.arrayOf(PropTypes.string),
};

LegacyDefinitions.defaultProps = {
  definitions: undefined,
};

function LegacyExample({ label, example, lang }) {
  if (!example) return null;
  return (
    <Section id="ex-title" label={label} className={styles.example}>
      <blockquote>
        <DictionaryMarkdown>{example}</DictionaryMarkdown>
        <TtsButton text={example} lang={lang} scope="sentence" />
      </blockquote>
    </Section>
  );
}

LegacyExample.propTypes = {
  label: PropTypes.string.isRequired,
  example: PropTypes.string,
  lang: PropTypes.string.isRequired,
};

LegacyExample.defaultProps = {
  example: undefined,
};

export default function LegacyDictionaryArticle({ entry, className, t, lang }) {
  const definitionsLabel = entry.definitions?.length
    ? t.definitionsLabel
    : t.noDefinition;

  return (
    <article className={className}>
      <PhoneticSection label={t.phoneticLabel} text={entry.phonetic} />
      <LegacyDefinitions
        label={definitionsLabel}
        definitions={entry.definitions}
      />
      <LegacyExample label={t.exampleLabel} example={entry.example} lang={lang} />
    </article>
  );
}

LegacyDictionaryArticle.propTypes = {
  entry: PropTypes.shape({
    phonetic: PropTypes.string,
    definitions: PropTypes.arrayOf(PropTypes.string),
    example: PropTypes.string,
  }).isRequired,
  className: PropTypes.string.isRequired,
  t: PropTypes.shape({
    phoneticLabel: PropTypes.string.isRequired,
    definitionsLabel: PropTypes.string.isRequired,
    noDefinition: PropTypes.string.isRequired,
    exampleLabel: PropTypes.string.isRequired,
  }).isRequired,
  lang: PropTypes.string.isRequired,
};
