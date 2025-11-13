import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deriveProbeDescriptionId,
  deriveProbeHeadingId,
  measureInstantly,
  sanitizeHeight,
} from "./settingsPanelHeightUtils.js";

const useHeightCache = () => {
  const [heightMap, setHeightMap] = useState({ active: null, reference: null });
  const cacheRef = useRef(new Map());

  const commitHeight = useCallback((type, rawHeight) => {
    const normalized = sanitizeHeight(rawHeight);
    setHeightMap((current) =>
      current[type] === normalized ? current : { ...current, [type]: normalized },
    );
    return normalized;
  }, []);

  const updateHeight = useCallback(
    (type, heightValue, sectionId) => {
      const normalized = commitHeight(type, heightValue);
      if (!sectionId?.trim()) {
        return;
      }
      if (normalized == null) {
        cacheRef.current.delete(sectionId);
      } else {
        cacheRef.current.set(sectionId, normalized);
      }
    },
    [commitHeight],
  );

  const applyCachedHeight = useCallback((type, sectionId) => {
    if (!sectionId?.trim()) {
      return false;
    }
    const cachedHeight = cacheRef.current.get(sectionId);
    if (cachedHeight == null) {
      return false;
    }
    setHeightMap((current) =>
      current[type] === cachedHeight ? current : { ...current, [type]: cachedHeight },
    );
    return true;
  }, []);

  return { heightMap, updateHeight, applyCachedHeight };
};

const observeNode = (node, callback) => {
  if (!node) {
    return null;
  }
  if (typeof ResizeObserver === "undefined") {
    callback(measureInstantly(node));
    return null;
  }

  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry?.contentRect?.height ?? null);
    }
  });
  observer.observe(node);
  return observer;
};

const useObservedHeight = (type, node, sectionId, handlers) => {
  const { updateHeight, applyCachedHeight } = handlers;

  useEffect(() => {
    if (!node) {
      updateHeight(type, null, sectionId);
      return undefined;
    }

    const hasCachedHeight = applyCachedHeight(type, sectionId);
    if (typeof ResizeObserver === "undefined") {
      if (!hasCachedHeight) {
        updateHeight(type, measureInstantly(node), sectionId);
      }
      return undefined;
    }

    const observer = observeNode(node, (value) =>
      updateHeight(type, value, sectionId),
    );
    return () => observer?.disconnect();
  }, [node, sectionId, type, updateHeight, applyCachedHeight]);
};

const useReferenceMeasurement = (section, registerNode) =>
  useMemo(() => {
    if (!section || typeof section.Component !== "function") {
      return null;
    }
    const Component = section.Component;
    const baseProps = section.componentProps ?? {};
    return {
      Component,
      props: {
        ...baseProps,
        headingId: deriveProbeHeadingId(section.id),
        descriptionId: deriveProbeDescriptionId(baseProps.descriptionId),
      },
      registerNode,
    };
  }, [section, registerNode]);

const usePanelNode = (type, sectionId, applyCachedHeight) => {
  const [node, setNode] = useState(null);

  const registerNode = useCallback(
    (nextNode) => {
      setNode(nextNode ?? null);
      if (nextNode) {
        applyCachedHeight(type, sectionId);
      }
    },
    [applyCachedHeight, sectionId, type],
  );

  return [node, registerNode];
};

const useReferenceSectionSync = (
  referenceSectionId,
  sections,
  updateHeight,
  applyCachedHeight,
) => {
  useEffect(() => {
    applyCachedHeight("reference", referenceSectionId);
  }, [applyCachedHeight, referenceSectionId]);

  useEffect(() => {
    if (!sections.find((section) => section.id === referenceSectionId)) {
      updateHeight("reference", null, referenceSectionId);
    }
  }, [referenceSectionId, sections, updateHeight]);
};

export const usePanelHeightRegistry = ({
  activeSectionId,
  referenceSectionId,
  sections,
}) => {
  const { heightMap, updateHeight, applyCachedHeight } = useHeightCache();
  const [activePanelNode, registerActivePanelNode] = usePanelNode("active", activeSectionId, applyCachedHeight);
  const [referencePanelNode, registerReferencePanelNode] = usePanelNode("reference", referenceSectionId, applyCachedHeight);
  useObservedHeight("active", activePanelNode, activeSectionId, { updateHeight, applyCachedHeight });
  useObservedHeight("reference", referencePanelNode, referenceSectionId, { updateHeight, applyCachedHeight });
  useReferenceSectionSync(referenceSectionId, sections, updateHeight, applyCachedHeight);
  const referenceMeasurement = useReferenceMeasurement(
    useMemo(() => sections.find((section) => section.id === referenceSectionId), [sections, referenceSectionId]),
    registerReferencePanelNode,
  );
  return { heightMap, referenceMeasurement, registerActivePanelNode, registerReferencePanelNode };
};
