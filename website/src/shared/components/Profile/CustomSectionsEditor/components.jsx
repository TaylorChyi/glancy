import PropTypes from "prop-types";

const handlerShape = PropTypes.shape({
  handleSectionTitleChange: PropTypes.func.isRequired,
  handleItemChange: PropTypes.func.isRequired,
  handleAddSection: PropTypes.func.isRequired,
  handleRemoveSection: PropTypes.func.isRequired,
  handleAddItem: PropTypes.func.isRequired,
  handleRemoveItem: PropTypes.func.isRequired,
});

export function CustomSectionsHeader({ t, styles, onAddSection }) {
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

CustomSectionsHeader.propTypes = {
  t: PropTypes.shape({
    customSectionsTitle: PropTypes.string.isRequired,
    customSectionsDescription: PropTypes.string.isRequired,
    customSectionAdd: PropTypes.string.isRequired,
  }).isRequired,
  styles: PropTypes.object.isRequired,
  onAddSection: PropTypes.func.isRequired,
};

export function CustomSectionsBody({ sections, t, styles, handlers }) {
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

CustomSectionsBody.propTypes = {
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
  t: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
  handlers: handlerShape.isRequired,
};

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

CustomSectionCard.propTypes = {
  section: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  t: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
  handlers: handlerShape.isRequired,
};

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

CustomItemsList.propTypes = {
  sectionId: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  t: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
  handlers: handlerShape.isRequired,
};

function createItemChangeHandler(handlers, sectionId, itemId, field) {
  return (event) =>
    handlers.handleItemChange(sectionId, itemId, field, event.target.value);
}

function renderItemInput({ value, placeholder, onChange }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  );
}

function CustomItemRow({ sectionId, item, t, styles, handlers }) {
  const changeHandler = (field) =>
    createItemChangeHandler(handlers, sectionId, item.id, field);
  return (
    <div className={styles["custom-item-row"]}>
      {renderItemInput({
        value: item.label,
        placeholder: t.customSectionItemLabelPlaceholder,
        onChange: changeHandler("label"),
      })}
      {renderItemInput({
        value: item.value,
        placeholder: t.customSectionItemValuePlaceholder,
        onChange: changeHandler("value"),
      })}
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

CustomItemRow.propTypes = {
  sectionId: PropTypes.string.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }).isRequired,
  t: PropTypes.object.isRequired,
  styles: PropTypes.object.isRequired,
  handlers: handlerShape.isRequired,
};

export { CustomSectionCard, CustomItemsList, CustomItemRow };
