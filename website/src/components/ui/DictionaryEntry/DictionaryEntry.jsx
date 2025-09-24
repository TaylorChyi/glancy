import { useLanguage } from "@/context";
import { TtsButton, PronounceableWord } from "@/components";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import DictionaryMarkdown from "./DictionaryMarkdown.jsx";
import { polishDictionaryMarkdown } from "@/utils";
import styles from "./DictionaryEntry.module.css";

function PersonalizationPanel({ data, labels }) {
  if (!data) return null;
  const {
    personaSummary,
    keyTakeaway,
    contextualExplanation,
    learningHooks = [],
    reflectionPrompts = [],
  } = data;
  const hasHooks = Array.isArray(learningHooks) && learningHooks.length > 0;
  const hasPrompts =
    Array.isArray(reflectionPrompts) && reflectionPrompts.length > 0;

  return (
    <section
      className={styles.personalization}
      aria-labelledby="personalization-title"
    >
      <div className={styles["personalization-header"]}>
        <span className={styles["personalization-badge"]}>{labels.badge}</span>
        <h2
          id="personalization-title"
          className={styles["personalization-title"]}
        >
          {labels.title}
        </h2>
      </div>
      {personaSummary && (
        <p className={styles["personalization-persona"]}>{personaSummary}</p>
      )}
      {keyTakeaway && (
        <p className={styles["personalization-key"]}>{keyTakeaway}</p>
      )}
      {contextualExplanation && (
        <p className={styles["personalization-context"]}>
          {contextualExplanation}
        </p>
      )}
      {hasHooks && (
        <div className={styles["personalization-block"]}>
          <h3 className={styles["personalization-subtitle"]}>{labels.hooks}</h3>
          <ul className={styles["personalization-list"]}>
            {learningHooks.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {hasPrompts && (
        <div className={styles["personalization-block"]}>
          <h3 className={styles["personalization-subtitle"]}>
            {labels.prompts}
          </h3>
          <ul className={styles["personalization-list"]}>
            {reflectionPrompts.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function tryParseJson(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function DictionaryEntry({ entry }) {
  const { t, lang } = useLanguage();
  if (!entry) return null;

  const personalization = entry.personalization;
  const personalizationNode = (
    <PersonalizationPanel
      data={personalization}
      labels={{
        title: t.personalizationTitle,
        badge: t.personalizationBadge,
        hooks: t.personalizationHooksTitle,
        prompts: t.personalizationPromptsTitle,
      }}
    />
  );

  if (entry.markdown) {
    const parsed = tryParseJson(entry.markdown);
    if (parsed) {
      return <DictionaryEntry entry={parsed} />;
    }
    const polished = polishDictionaryMarkdown(entry.markdown);
    return (
      <article className={styles["dictionary-entry"]}>
        {personalizationNode}
        <DictionaryMarkdown>{polished}</DictionaryMarkdown>
      </article>
    );
  }

  // new format detected by the presence of Chinese keys
  const isNew = Object.prototype.hasOwnProperty.call(entry, "发音解释");

  if (!isNew) {
    const { phonetic, definitions, example } = entry;
    return (
      <article className={styles["dictionary-entry"]}>
        {personalizationNode}
        {phonetic && (
          <section
            className={styles["phonetic-section"]}
            aria-labelledby="phon-title"
          >
            <h2 id="phon-title" className={styles["section-title"]}>
              【{t.phoneticLabel}】
            </h2>
            <p className={styles.phonetic}>{phonetic}</p>
          </section>
        )}
        {definitions && definitions.length > 0 ? (
          <section className={styles.definitions} aria-labelledby="def-title">
            <h2 id="def-title" className={styles["section-title"]}>
              【{t.definitionsLabel}】
            </h2>
            <ol>
              {definitions.map((d, i) => (
                <li key={i}>
                  <DictionaryMarkdown>{d}</DictionaryMarkdown>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className={styles["no-definition"]}>{t.noDefinition}</p>
        )}
        {example && (
          <section className={styles.example} aria-labelledby="ex-title">
            <h2 id="ex-title" className={styles["section-title"]}>
              【{t.exampleLabel}】
            </h2>
            <blockquote>
              <DictionaryMarkdown>{example}</DictionaryMarkdown>
              <TtsButton text={example} lang={lang} scope="sentence" />
            </blockquote>
          </section>
        )}
      </article>
    );
  }

  const term = entry["词条"];
  const variants = entry["变形"] || [];
  const phonetic = entry["发音"] || {};
  const groups = entry["发音解释"] || [];
  const phrases = entry["常见词组"] || [];

  const synLabel = t.synonymsLabel || "同义词";
  const antLabel = t.antonymsLabel || "反义词";
  const relLabel = t.relatedLabel || "相关词";
  const varLabel = t.variantsLabel || "变形";
  const phrLabel = t.phrasesLabel || "常见词组";

  const phoneticText = [phonetic["英音"], phonetic["美音"]]
    .filter(Boolean)
    .join(" / ");

  const defs = groups.flatMap((g) => g.释义 || []);

  return (
    <article className={styles["dictionary-entry"]}>
      {personalizationNode}
      {term && (
        <h2 className={styles["section-title"]}>
          <PronounceableWord text={term} lang={lang} />
        </h2>
      )}
      {phoneticText && (
        <section
          className={styles["phonetic-section"]}
          aria-labelledby="phon-title"
        >
          <h2 id="phon-title" className={styles["section-title"]}>
            【{t.phoneticLabel}】
          </h2>
          <p className={styles.phonetic}>{phoneticText}</p>
        </section>
      )}
      {variants.length > 0 && (
        <section className={styles.variants} aria-labelledby="var-title">
          <h2 id="var-title" className={styles["section-title"]}>
            【{varLabel}】
          </h2>
          <ul>
            {variants.map((v, i) => (
              <li key={i}>
                {v.状态}：{v.词形}
              </li>
            ))}
          </ul>
        </section>
      )}
      {defs.length > 0 ? (
        <section className={styles.definitions} aria-labelledby="def-title">
          <h2 id="def-title" className={styles["section-title"]}>
            【{t.definitionsLabel}】
          </h2>
          <ol>
            {defs.map((d, i) => (
              <li key={i}>
                <MarkdownRenderer className={styles["definition-markdown"]}>
                  {d.定义}
                </MarkdownRenderer>
                {d.类别 && <div className={styles.pos}>{d.类别}</div>}
                {d.关系词 && (
                  <div className={styles.relations}>
                    {d.关系词.同义词?.length > 0 && (
                      <div>
                        {synLabel}: {d.关系词.同义词.join(", ")}
                      </div>
                    )}
                    {d.关系词.反义词?.length > 0 && (
                      <div>
                        {antLabel}: {d.关系词.反义词.join(", ")}
                      </div>
                    )}
                    {d.关系词.相关词?.length > 0 && (
                      <div>
                        {relLabel}: {d.关系词.相关词.join(", ")}
                      </div>
                    )}
                  </div>
                )}
                {d.例句?.length > 0 && (
                  <ul className={styles.examples}>
                    {d.例句.map((ex, j) => (
                      <li key={j}>
                        <blockquote>
                          <MarkdownRenderer>{ex.源语言}</MarkdownRenderer>
                          <TtsButton
                            text={ex.源语言}
                            lang={lang}
                            scope="sentence"
                          />
                        </blockquote>
                        <blockquote>
                          <MarkdownRenderer>{ex.翻译}</MarkdownRenderer>
                        </blockquote>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className={styles["no-definition"]}>{t.noDefinition}</p>
      )}
      {phrases.length > 0 && (
        <section className={styles.phrases} aria-labelledby="phr-title">
          <h2 id="phr-title" className={styles["section-title"]}>
            【{phrLabel}】
          </h2>
          <ul>
            {phrases.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export default DictionaryEntry;
