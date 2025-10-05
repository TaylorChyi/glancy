import { useCallback, useMemo, useState } from "react";
import { PROFILE_CUSTOM_SECTIONS_SCHEMA } from "@/config/profileSections.js";

/**
 * 背景：
 *  - Profile 页面需要统一的状态管理来支撑配置化的自定义区块。
 * 目的：
 *  - 封装区块的初始化、重置与序列化逻辑，使页面组件只关注布局。
 * 关键决策与取舍：
 *  - 通过 hook 内部维护不可变的区块结构，提供最小化的更新接口；
 *  - 遇到未知区块时仍保留，以兼容未来扩展。
 * 影响范围：
 *  - Profile 页面调用该 hook 渲染区块，并在保存时生成后端所需 payload。
 * 演进与TODO：
 *  - TODO: 支持区块标题编辑或动态增删区块时，可在此扩展对应接口。
 */

const buildSectionState = (schema, initialSections = []) => {
  const schemaById = new Map();
  for (const section of schema) {
    if (!section?.id) continue;
    schemaById.set(section.id, section);
  }

  const initialById = new Map();
  for (const section of initialSections ?? []) {
    if (!section?.id) continue;
    initialById.set(section.id, section);
  }

  const result = [];
  for (const section of schemaById.values()) {
    const initial = initialById.get(section.id);
    const initialItems = new Map();
    if (initial?.items) {
      for (const item of initial.items) {
        if (!item?.id) continue;
        initialItems.set(item.id, item);
      }
    }
    result.push({
      id: section.id,
      title: initial?.title ?? null,
      definition: section,
      items: section.items.map((itemDef) => {
        const initialItem = initialItems.get(itemDef.id);
        return {
          id: itemDef.id,
          definition: itemDef,
          label: initialItem?.label ?? null,
          value: initialItem?.value ?? "",
        };
      }),
    });
  }

  for (const section of initialSections ?? []) {
    if (!section?.id || schemaById.has(section.id)) continue;
    const orphanItems = (section.items ?? []).filter((item) => item?.id);
    result.push({
      id: section.id,
      title: section.title ?? null,
      definition: {
        id: section.id,
        icon: null,
        titleKey: null,
        descriptionKey: null,
        items: orphanItems.map((item) => ({
          id: item.id,
          labelKey: null,
          placeholderKey: null,
          multiline: false,
        })),
      },
      items: orphanItems.map((item) => ({
        id: item.id,
        definition: {
          id: item.id,
          labelKey: null,
          placeholderKey: null,
          multiline: false,
        },
        label: item.label ?? null,
        value: item.value ?? "",
      })),
    });
  }

  return result;
};

const normalizeText = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function useProfileSections({
  schema = PROFILE_CUSTOM_SECTIONS_SCHEMA,
  initialSections = [],
} = {}) {
  const memoizedSchema = useMemo(() => schema, [schema]);
  const [sections, setSections] = useState(() =>
    buildSectionState(memoizedSchema, initialSections),
  );

  const resetSections = useCallback(
    (nextSections = []) => {
      setSections(buildSectionState(memoizedSchema, nextSections));
    },
    [memoizedSchema],
  );

  const updateItem = useCallback((sectionId, itemId, value) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  value,
                }
              : item,
          ),
        };
      }),
    );
  }, []);

  const toPayload = useCallback(
    () =>
      sections.map((section) => ({
        id: section.id,
        title: normalizeText(section.title),
        items: section.items.map((item) => ({
          id: item.id,
          label: normalizeText(item.label),
          value: normalizeText(item.value),
        })),
      })),
    [sections],
  );

  return { sections, updateItem, resetSections, toPayload };
}
