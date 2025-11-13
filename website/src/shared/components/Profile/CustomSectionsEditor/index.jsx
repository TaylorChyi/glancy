import PropTypes from "prop-types";
import { useCustomSections } from "./useCustomSections.js";

function CustomSectionsHeader({ t, styles, onAddSection }) {
  return (
    <header className={styles["custom-sections-header"]}>
      <div>
        <h3>{t.customSectionsTitle}</h3>
        <p>{t.customSectionsDescription}</p>
      </div>
      <button
        type="button"
        className={styles["custom-section-add"]}
        onClick={onAddSection}
      >
        {t.customSectionAdd}
      </button>
    </header>
  );
}

function CustomSectionsBody({ sections, t, styles, handlers }) {
  if (sections.length === 0) {
    return (
      <p className={styles["custom-sections-empty"]}>{t.customSectionsEmpty}</p>
    );
  }

  return sections.map((section) => (
    <CustomSectionCard
      key={section.id}
      section={section}
      t={t}
      styles={styles}
      handlers={handlers}
    />
  ));
}

function CustomSectionCard({ section, t, styles, handlers }) {
  return (
    <div className={styles["custom-section-card"]}>
      <div className={styles["custom-section-header"]}>
        <input
          value={section.title}
          onChange={(event) =>
            handlers.handleSectionTitleChange(section.id, event.target.value)
          }
          placeholder={t.customSectionTitlePlaceholder}
        />
        <button
          type="button"
          className={styles["custom-section-remove"]}
          onClick={() => handlers.handleRemoveSection(section.id)}
        >
          {t.customSectionRemove}
        </button>
      </div>
      <CustomItemsList
        sectionId={section.id}
        items={section.items}
        t={t}
        styles={styles}
        handlers={handlers}
      />
    </div>
  );
}

function CustomItemsList({ sectionId, items, t, styles, handlers }) {
  return (
    <div className={styles["custom-items"]}>
      {items.map((item) => (
        <CustomItemRow
          key={item.id}
          sectionId={sectionId}
          item={item}
          t={t}
          styles={styles}
          handlers={handlers}
        />
      ))}
      <button
        type="button"
        className={styles["custom-item-add"]}
        onClick={() => handlers.handleAddItem(sectionId)}
      >
        {t.customSectionItemAdd}
      </button>
    </div>
  );
}

function CustomItemRow({ sectionId, item, t, styles, handlers }) {
  return (
    <div className={styles["custom-item-row"]}>
      <input
        value={item.label}
        onChange={(event) =>
          handlers.handleItemChange(
            sectionId,
            item.id,
            "label",
            event.target.value,
          )
        }
        placeholder={t.customSectionItemLabelPlaceholder}
      />
      <input
        value={item.value}
        onChange={(event) =>
          handlers.handleItemChange(
            sectionId,
            item.id,
            "value",
            event.target.value,
          )
        }
        placeholder={t.customSectionItemValuePlaceholder}
      />
      <button
        type="button"
        className={styles["custom-item-remove"]}
        onClick={() => handlers.handleRemoveItem(sectionId, item.id)}
      >
        {t.customSectionItemRemove}
      </button>
    </div>
  );
}

export default function CustomSectionsEditor({
  sections,
  onChange,
  t,
  styles,
}) {
  const handlers = useCustomSections({ sections, onChange });

  return (
    <section className={styles["custom-sections"]}>
      <CustomSectionsHeader t={t} styles={styles} onAddSection={handlers.handleAddSection} />
      <div className={styles["custom-sections-body"]}>
        <CustomSectionsBody
          sections={sections}
          t={t}
          styles={styles}
          handlers={handlers}
        />
      </div>
    </section>
  );
}

CustomSectionsEditor.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          value: PropTypes.string.isRequired,
        }),
      ).isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  t: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
};
