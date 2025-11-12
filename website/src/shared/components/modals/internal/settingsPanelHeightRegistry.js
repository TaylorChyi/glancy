import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deriveProbeDescriptionId,
  deriveProbeHeadingId,
  measureInstantly,
  sanitizeHeight,
} from "./settingsPanelHeightUtils.js";

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

export const usePanelHeightRegistry = ({
  activeSectionId,
  referenceSectionId,
  sections,
}) => {
  const [activePanelNode, setActivePanelNode] = useState(null);
  const [referencePanelNode, setReferencePanelNode] = useState(null);
  const [heightMap, setHeightMap] = useState({ active: null, reference: null });
  const heightCacheRef = useRef(new Map());

  const applyHeightUpdate = useCallback((type, heightValue, sectionId) => {
    const normalized = sanitizeHeight(heightValue);
    setHeightMap((current) => {
      if (current[type] === normalized) {
        return current;
      }
      return { ...current, [type]: normalized };
    });

    if (typeof sectionId === "string" && sectionId.trim().length > 0) {
      if (normalized === null) {
        heightCacheRef.current.delete(sectionId);
      } else {
        heightCacheRef.current.set(sectionId, normalized);
      }
    }
  }, []);

  const applyCachedHeight = useCallback((type, sectionId) => {
    if (typeof sectionId !== "string" || sectionId.trim().length === 0) {
      return false;
    }
    const cachedHeight = heightCacheRef.current.get(sectionId);
    if (cachedHeight == null) {
      return false;
    }
    setHeightMap((current) => {
      if (current[type] === cachedHeight) {
        return current;
      }
      return { ...current, [type]: cachedHeight };
    });
    return true;
  }, []);

  const updateActiveHeight = useCallback(
    (heightValue) => {
      applyHeightUpdate("active", heightValue, activeSectionId);
    },
    [activeSectionId, applyHeightUpdate],
  );

  const updateReferenceHeight = useCallback(
    (heightValue) => {
      applyHeightUpdate("reference", heightValue, referenceSectionId);
    },
    [applyHeightUpdate, referenceSectionId],
  );

  useEffect(() => {
    if (!activePanelNode) {
      updateActiveHeight(null);
      return undefined;
    }
    if (typeof ResizeObserver === "undefined") {
      if (applyCachedHeight("active", activeSectionId)) {
        return undefined;
      }
      updateActiveHeight(measureInstantly(activePanelNode));
      return undefined;
    }
    const observer = observeNode(activePanelNode, updateActiveHeight);
    return () => observer?.disconnect();
  }, [
    activePanelNode,
    activeSectionId,
    applyCachedHeight,
    updateActiveHeight,
  ]);

  useEffect(() => {
    if (!referencePanelNode) {
      updateReferenceHeight(null);
      return undefined;
    }
    if (typeof ResizeObserver === "undefined") {
      if (applyCachedHeight("reference", referenceSectionId)) {
        return undefined;
      }
      updateReferenceHeight(measureInstantly(referencePanelNode));
      return undefined;
    }
    const observer = observeNode(referencePanelNode, updateReferenceHeight);
    return () => observer?.disconnect();
  }, [
    referencePanelNode,
    referenceSectionId,
    applyCachedHeight,
    updateReferenceHeight,
  ]);

  useEffect(() => {
    applyCachedHeight("active", activeSectionId);
  }, [activeSectionId, applyCachedHeight]);

  useEffect(() => {
    if (!referenceSectionId) {
      return;
    }
    applyCachedHeight("reference", referenceSectionId);
  }, [applyCachedHeight, referenceSectionId]);

  useEffect(() => {
    if (!sections.find((section) => section.id === referenceSectionId)) {
      updateReferenceHeight(null);
    }
  }, [referenceSectionId, sections, updateReferenceHeight]);

  const referenceSection = useMemo(
    () => sections.find((section) => section.id === referenceSectionId),
    [sections, referenceSectionId],
  );

  const registerActivePanelNode = useCallback(
    (node) => {
      setActivePanelNode(node ?? null);
      if (node) {
        applyCachedHeight("active", activeSectionId);
      }
    },
    [activeSectionId, applyCachedHeight],
  );

  const registerReferencePanelNode = useCallback(
    (node) => {
      setReferencePanelNode(node ?? null);
      if (node) {
        applyCachedHeight("reference", referenceSectionId);
      }
    },
    [applyCachedHeight, referenceSectionId],
  );

  const referenceMeasurement = useMemo(() => {
    if (!referenceSection || typeof referenceSection.Component !== "function") {
      return null;
    }
    const Component = referenceSection.Component;
    const baseProps = referenceSection.componentProps ?? {};
    return {
      Component,
      props: {
        ...baseProps,
        headingId: deriveProbeHeadingId(referenceSection.id),
        descriptionId: deriveProbeDescriptionId(baseProps.descriptionId),
      },
      registerNode: registerReferencePanelNode,
    };
  }, [referenceSection, registerReferencePanelNode]);

  return {
    heightMap,
    referenceMeasurement,
    registerActivePanelNode,
    registerReferencePanelNode,
  };
};
