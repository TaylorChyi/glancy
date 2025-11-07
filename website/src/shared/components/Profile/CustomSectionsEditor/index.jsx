import PropTypes from "prop-types";
import {
  createCustomItem,
  createCustomSection,
} from "@app/pages/profile/profileDetailsModel.js";

function updateSection(sections, sectionId, updater) {
  return sections.map((section) => {
    if (section.id !== sectionId) return section;
    return updater(section);
  });
}

export default function CustomSectionsEditor({
  sections,
  onChange,
  t,
  styles,
}) {
  const handleSectionTitleChange = (sectionId, value) => {
    const next = updateSection(sections, sectionId, (section) => ({
      ...section,
      title: value,
    }));
    onChange(next);
  };

  const handleItemChange = (sectionId, itemId, field, value) => {
    const next = updateSection(sections, sectionId, (section) => ({
      ...section,
      items: section.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }));
    onChange(next);
  };

  const handleAddSection = () => {
    onChange([...sections, createCustomSection()]);
  };

  const handleRemoveSection = (sectionId) => {
    const next = sections.filter((section) => section.id !== sectionId);
    onChange(next);
  };

  const handleAddItem = (sectionId) => {
    const next = updateSection(sections, sectionId, (section) => ({
      ...section,
      items: [...section.items, createCustomItem()],
    }));
    onChange(next);
  };

  const handleRemoveItem = (sectionId, itemId) => {
    const next = updateSection(sections, sectionId, (section) => {
      const remaining = section.items.filter((item) => item.id !== itemId);
      return {
        ...section,
        items: remaining.length > 0 ? remaining : [createCustomItem()],
      };
    });
    onChange(next);
  };

  return (
    <section className={styles["custom-sections"]}>
      <header className={styles["custom-sections-header"]}>
        <div>
          <h3>{t.customSectionsTitle}</h3>
          <p>{t.customSectionsDescription}</p>
        </div>
        <button
          type="button"
          className={styles["custom-section-add"]}
          onClick={handleAddSection}
        >
          {t.customSectionAdd}
        </button>
      </header>
      <div className={styles["custom-sections-body"]}>
        {sections.length === 0 ? (
          <p className={styles["custom-sections-empty"]}>
            {t.customSectionsEmpty}
          </p>
        ) : (
          sections.map((section) => (
            <div key={section.id} className={styles["custom-section-card"]}>
              <div className={styles["custom-section-header"]}>
                <input
                  value={section.title}
                  onChange={(event) =>
                    handleSectionTitleChange(section.id, event.target.value)
                  }
                  placeholder={t.customSectionTitlePlaceholder}
                />
                <button
                  type="button"
                  className={styles["custom-section-remove"]}
                  onClick={() => handleRemoveSection(section.id)}
                >
                  {t.customSectionRemove}
                </button>
              </div>
              <div className={styles["custom-items"]}>
                {section.items.map((item) => (
                  <div key={item.id} className={styles["custom-item-row"]}>
                    <input
                      value={item.label}
                      onChange={(event) =>
                        handleItemChange(
                          section.id,
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
                        handleItemChange(
                          section.id,
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
                      onClick={() => handleRemoveItem(section.id, item.id)}
                    >
                      {t.customSectionItemRemove}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles["custom-item-add"]}
                  onClick={() => handleAddItem(section.id)}
                >
                  {t.customSectionItemAdd}
                </button>
              </div>
            </div>
          ))
        )}
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
