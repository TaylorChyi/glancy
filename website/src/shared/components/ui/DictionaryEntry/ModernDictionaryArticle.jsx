import PropTypes from "prop-types";
import { TtsButton, PronounceableWord } from "@shared/components";
import MarkdownRenderer from "@shared/components/ui/MarkdownRenderer";
import styles from "./DictionaryEntry.module.css";
import { Section, PhoneticSection } from "./DictionarySections.jsx";
import { VariantList, PhraseList } from "./ModernDictionaryLists.jsx";
import { createStableKeyFactory } from "./stableKeyFactory.js";

function buildModernMetadata(entry) {
  const pronunciations = entry["发音"] || {};
  const phoneticText = [pronunciations["英音"], pronunciations["美音"]]
    .filter(Boolean)
    .join(" / ");

  return {
    term: entry["词条"],
    phoneticText,
    variants: entry["变形"] || [],
    definitions: (entry["发音解释"] || []).flatMap((group) => group.释义 || []),
    phrases: entry["常见词组"] || [],
  };
}

function buildRelationLabels(t) {
  return {
    synonyms: t.synonymsLabel || "同义词",
    antonyms: t.antonymsLabel || "反义词",
    related: t.relatedLabel || "相关词",
    variants: t.variantsLabel || "变形",
    phrases: t.phrasesLabel || "常见词组",
  };
}

function Relations({ relations, labels }) {
  if (!relations) return null;
  const rows = [
    { label: labels.synonyms, values: relations.同义词 },
    { label: labels.antonyms, values: relations.反义词 },
    { label: labels.related, values: relations.相关词 },
  ].filter((item) => item.values?.length);

  if (!rows.length) return null;

  return (
    <div className={styles.relations}>
      {rows.map((row) => (
        <div key={row.label}>
          {row.label}: {row.values.join(", ")}
        </div>
      ))}
    </div>
  );
}

Relations.propTypes = {
  relations: PropTypes.shape({
    同义词: PropTypes.arrayOf(PropTypes.string),
    反义词: PropTypes.arrayOf(PropTypes.string),
    相关词: PropTypes.arrayOf(PropTypes.string),
  }),
  labels: PropTypes.shape({
    synonyms: PropTypes.string.isRequired,
    antonyms: PropTypes.string.isRequired,
    related: PropTypes.string.isRequired,
  }).isRequired,
};

Relations.defaultProps = {
  relations: undefined,
};

function Examples({ examples, lang }) {
  if (!examples?.length) return null;
  const keyForExample = createStableKeyFactory("example");
  return (
    <ul className={styles.examples}>
      {examples.map((example) => (
        <li key={keyForExample([example?.源语言, example?.翻译])}>
          <blockquote>
            <MarkdownRenderer>{example.源语言}</MarkdownRenderer>
            <TtsButton text={example.源语言} lang={lang} scope="sentence" />
          </blockquote>
          <blockquote>
            <MarkdownRenderer>{example.翻译}</MarkdownRenderer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

Examples.propTypes = {
  examples: PropTypes.arrayOf(
    PropTypes.shape({
      源语言: PropTypes.string.isRequired,
      翻译: PropTypes.string.isRequired,
    }),
  ),
  lang: PropTypes.string.isRequired,
};

Examples.defaultProps = {
  examples: undefined,
};

function ModernDefinition({ definition, labels, lang }) {
  return (
    <li>
      <MarkdownRenderer className={styles["definition-markdown"]}>
        {definition.定义}
      </MarkdownRenderer>
      {definition.类别 && <div className={styles.pos}>{definition.类别}</div>}
      <Relations relations={definition.关系词} labels={labels} />
      <Examples examples={definition.例句} lang={lang} />
    </li>
  );
}

ModernDefinition.propTypes = {
  definition: PropTypes.shape({
    定义: PropTypes.string.isRequired,
    类别: PropTypes.string,
    关系词: PropTypes.shape({
      同义词: PropTypes.arrayOf(PropTypes.string),
      反义词: PropTypes.arrayOf(PropTypes.string),
      相关词: PropTypes.arrayOf(PropTypes.string),
    }),
    例句: PropTypes.arrayOf(
      PropTypes.shape({
        源语言: PropTypes.string.isRequired,
        翻译: PropTypes.string.isRequired,
      }),
    ),
  }).isRequired,
  labels: PropTypes.object.isRequired,
  lang: PropTypes.string.isRequired,
};

function ModernDefinitions({
  definitions,
  definitionLabel,
  labels,
  lang,
  fallback,
}) {
  if (!definitions.length) {
    return <p className={styles["no-definition"]}>{fallback}</p>;
  }
  const keyForDefinition = createStableKeyFactory("definition");
  return (
    <Section id="def-title" label={definitionLabel} className={styles.definitions}>
      <ol>
        {definitions.map((definition) => (
          <ModernDefinition
            key={keyForDefinition([definition?.定义, definition?.类别])}
            definition={definition}
            labels={labels}
            lang={lang}
          />
        ))}
      </ol>
    </Section>
  );
}

ModernDefinitions.propTypes = {
  definitions: PropTypes.arrayOf(PropTypes.object).isRequired,
  definitionLabel: PropTypes.string.isRequired,
  labels: PropTypes.object.isRequired,
  lang: PropTypes.string.isRequired,
  fallback: PropTypes.string.isRequired,
};

export default function ModernDictionaryArticle({ entry, className, t, lang }) {
  const meta = buildModernMetadata(entry);
  const labels = buildRelationLabels(t);
  return (
    <article className={className}>
      {meta.term && (
        <h2 className={styles["section-title"]}>
          <PronounceableWord text={meta.term} lang={lang} />
        </h2>
      )}
      <PhoneticSection label={t.phoneticLabel} text={meta.phoneticText} />
      <VariantList label={labels.variants} variants={meta.variants} />
      <ModernDefinitions
        definitions={meta.definitions}
        definitionLabel={t.definitionsLabel}
        labels={labels}
        lang={lang}
        fallback={t.noDefinition}
      />
      <PhraseList label={labels.phrases} phrases={meta.phrases} />
    </article>
  );
}

ModernDictionaryArticle.propTypes = {
  entry: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired,
  t: PropTypes.shape({
    phoneticLabel: PropTypes.string.isRequired,
    definitionsLabel: PropTypes.string.isRequired,
    noDefinition: PropTypes.string.isRequired,
    synonymsLabel: PropTypes.string,
    antonymsLabel: PropTypes.string,
    relatedLabel: PropTypes.string,
    variantsLabel: PropTypes.string,
    phrasesLabel: PropTypes.string,
  }).isRequired,
  lang: PropTypes.string.isRequired,
};
