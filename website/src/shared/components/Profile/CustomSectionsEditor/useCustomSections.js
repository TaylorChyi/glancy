import { useCallback } from "react";
import {
  createCustomItem,
  createCustomSection,
} from "@app/pages/profile/profileDetailsModel.js";

const updateSection = (sections, sectionId, updater) =>
  sections.map((section) =>
    section.id === sectionId ? updater(section) : section,
  );

const ensureSectionItems = (items) =>
  items.length > 0 ? items : [createCustomItem()];

export default function useCustomSections({ sections, onChange }) {
  const applySectionUpdate = useCallback(
    (sectionId, updater) => {
      const nextSections = updateSection(sections, sectionId, updater);
      onChange(nextSections);
    },
    [sections, onChange],
  );

  const handleSectionTitleChange = useCallback(
    (sectionId, value) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        title: value,
      }));
    },
    [applySectionUpdate],
  );

  const handleItemChange = useCallback(
    (sectionId, itemId, field, value) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item,
        ),
      }));
    },
    [applySectionUpdate],
  );

  const handleAddSection = useCallback(() => {
    onChange([...sections, createCustomSection()]);
  }, [onChange, sections]);

  const handleRemoveSection = useCallback(
    (sectionId) => {
      onChange(sections.filter((section) => section.id !== sectionId));
    },
    [onChange, sections],
  );

  const handleAddItem = useCallback(
    (sectionId) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        items: [...section.items, createCustomItem()],
      }));
    },
    [applySectionUpdate],
  );

  const handleRemoveItem = useCallback(
    (sectionId, itemId) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        items: ensureSectionItems(
          section.items.filter((item) => item.id !== itemId),
        ),
      }));
    },
    [applySectionUpdate],
  );

  return {
    handleSectionTitleChange,
    handleItemChange,
    handleAddSection,
    handleRemoveSection,
    handleAddItem,
    handleRemoveItem,
  };
}

export { useCustomSections };
