import PropTypes from "prop-types";
import { CustomSectionsHeader, CustomSectionsBody } from "./components.jsx";
import useCustomSections from "./useCustomSections.js";

export default function CustomSectionsEditor({
  sections,
  onChange,
  t,
  styles,
}) {
  const handlers = useCustomSections({ sections, onChange });

  return (
    <section className={styles["custom-sections"]}>
      <CustomSectionsHeader
        t={t}
        styles={styles}
        onAddSection={handlers.handleAddSection}
      />
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
