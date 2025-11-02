/**
 * 背景：
 *  - 激活分区状态管理包含初始同步、分区变更自愈等逻辑，原本散落在主 Hook 中。
 * 目的：
 *  - 抽离为独立 Hook，统一维护 sanitize 与同步策略，复用性更高。
 * 关键决策与取舍：
 *  - 使用 useRef 记录初始同步标记，避免重复重置；
 *  - 将 sanitizeActiveSectionId 作为策略注入，保持纯函数化。
 * 影响范围：
 *  - 偏好设置页面与 SettingsModal 的导航状态。
 * 演进与TODO：
 *  - 后续可在此支持根据用户偏好记忆上次访问分区。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeActiveSectionId } from "./utils/sanitizeActiveSectionId.js";

export const usePreferenceNavigation = ({ initialSectionId, sections }) => {
  const [activeSectionId, setActiveSectionId] = useState(() =>
    sanitizeActiveSectionId(initialSectionId, sections),
  );
  const hasAppliedInitialRef = useRef(false);
  const previousInitialRef = useRef(initialSectionId);
  const previousSanitizedInitialRef = useRef(
    sanitizeActiveSectionId(initialSectionId, sections),
  );

  useEffect(() => {
    setActiveSectionId((current) => {
      const sanitized = sanitizeActiveSectionId(current, sections);
      return sanitized === current ? current : sanitized;
    });
  }, [sections]);

  useEffect(() => {
    const nextInitial = sanitizeActiveSectionId(initialSectionId, sections);
    const initialChanged = previousInitialRef.current !== initialSectionId;
    const sanitizedChanged =
      previousSanitizedInitialRef.current !== nextInitial;
    const shouldSync =
      !hasAppliedInitialRef.current || initialChanged || sanitizedChanged;

    if (!shouldSync) {
      return undefined;
    }

    hasAppliedInitialRef.current = true;
    previousInitialRef.current = initialSectionId;
    previousSanitizedInitialRef.current = nextInitial;

    setActiveSectionId((current) =>
      current === nextInitial ? current : nextInitial,
    );

    return undefined;
  }, [initialSectionId, sections]);

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  const handleSectionSelect = useCallback((section) => {
    if (!section || section.disabled) {
      return;
    }
    setActiveSectionId((current) =>
      current === section.id ? current : section.id,
    );
  }, []);

  return {
    activeSectionId,
    activeSection,
    handleSectionSelect,
    setActiveSectionId,
  };
};
