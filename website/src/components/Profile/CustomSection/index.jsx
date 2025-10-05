import PropTypes from "prop-types";
import FormField from "@/components/form/FormField.jsx";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./CustomSection.module.css";

const resolveTranslation = (t, key, fallback) => {
  if (!key) return fallback ?? "";
  const segments = key.split(".");
  let current = t;
  for (const segment of segments) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      current = null;
      break;
    }
  }
  if (typeof current === "string") {
    return current;
  }
  return fallback ?? "";
};

export default function ProfileCustomSection({ section, onItemChange, t }) {
  const title =
    section.title ?? resolveTranslation(t, section.definition?.titleKey, "");
  const description = resolveTranslation(
    t,
    section.definition?.descriptionKey,
    "",
  );

  return (
    <section className={styles.section} aria-labelledby={`${section.id}-title`}>
      <header className={styles.header}>
        {section.definition?.icon ? (
          <ThemeIcon
            name={section.definition.icon}
            width={20}
            height={20}
            className={styles.icon}
            aria-hidden="true"
          />
        ) : null}
        <div className={styles.meta}>
          <h3 id={`${section.id}-title`} className={styles.title}>
            {title || section.id}
          </h3>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
        </div>
      </header>
      <div className={styles.items}>
        {section.items.map((item) => {
          const label = resolveTranslation(
            t,
            item.definition?.labelKey,
            item.label || "",
          );
          const placeholder = resolveTranslation(
            t,
            item.definition?.placeholderKey,
            "",
          );
          const id = `${section.id}-${item.id}`;
          return (
            <FormField key={id} label={label} id={id}>
              {item.definition?.multiline ? (
                <textarea
                  id={id}
                  className={styles.multiline}
                  value={item.value}
                  placeholder={placeholder}
                  rows={4}
                  onChange={(event) =>
                    onItemChange(section.id, item.id, event.target.value)
                  }
                />
              ) : (
                <input
                  id={id}
                  className={styles.input}
                  value={item.value}
                  placeholder={placeholder}
                  onChange={(event) =>
                    onItemChange(section.id, item.id, event.target.value)
                  }
                />
              )}
            </FormField>
          );
        })}
      </div>
    </section>
  );
}

const itemDefinitionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  labelKey: PropTypes.string,
  placeholderKey: PropTypes.string,
  multiline: PropTypes.bool,
});

const itemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  definition: itemDefinitionShape.isRequired,
  label: PropTypes.string,
  value: PropTypes.string,
});

const sectionDefinitionShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  icon: PropTypes.string,
  titleKey: PropTypes.string,
  descriptionKey: PropTypes.string,
  items: PropTypes.arrayOf(itemDefinitionShape).isRequired,
});

ProfileCustomSection.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    definition: sectionDefinitionShape.isRequired,
    items: PropTypes.arrayOf(itemShape).isRequired,
  }).isRequired,
  onItemChange: PropTypes.func.isRequired,
  t: PropTypes.object,
};

ProfileCustomSection.defaultProps = {
  t: {},
};
