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

const useApplySectionUpdate = (sections, onChange) =>
  useCallback(
    (sectionId, updater) => {
      onChange(updateSection(sections, sectionId, updater));
    },
    [sections, onChange],
  );

const useSectionTitleChangeHandler = (applySectionUpdate) =>
  useCallback(
    (sectionId, value) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        title: value,
      }));
    },
    [applySectionUpdate],
  );

const useItemChangeHandler = (applySectionUpdate) =>
  useCallback(
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

const useAddSectionHandler = (sections, onChange) =>
  useCallback(() => {
    onChange([...sections, createCustomSection()]);
  }, [onChange, sections]);

const useRemoveSectionHandler = (sections, onChange) =>
  useCallback(
    (sectionId) => {
      onChange(sections.filter((section) => section.id !== sectionId));
    },
    [onChange, sections],
  );

const useAddItemHandler = (applySectionUpdate) =>
  useCallback(
    (sectionId) => {
      applySectionUpdate(sectionId, (section) => ({
        ...section,
        items: [...section.items, createCustomItem()],
      }));
    },
    [applySectionUpdate],
  );

const useRemoveItemHandler = (applySectionUpdate) =>
  useCallback(
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

export default function useCustomSections({ sections, onChange }) {
  const applySectionUpdate = useApplySectionUpdate(sections, onChange);

  return {
    handleSectionTitleChange: useSectionTitleChangeHandler(applySectionUpdate),
    handleItemChange: useItemChangeHandler(applySectionUpdate),
    handleAddSection: useAddSectionHandler(sections, onChange),
    handleRemoveSection: useRemoveSectionHandler(sections, onChange),
    handleAddItem: useAddItemHandler(applySectionUpdate),
    handleRemoveItem: useRemoveItemHandler(applySectionUpdate),
  };
}

export { useCustomSections };
