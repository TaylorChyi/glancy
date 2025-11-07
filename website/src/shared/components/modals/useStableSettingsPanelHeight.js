import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_REFERENCE_SECTION_ID = "data";

const sanitizeHeight = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  return value;
};

function deriveProbeHeadingId(sectionId) {
  if (typeof sectionId !== "string" || sectionId.trim().length === 0) {
    return "settings-panel-height-probe-heading";
  }
  return `${sectionId}-panel-height-probe-heading`;
}

const deriveProbeDescriptionId = (candidate) => {
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return undefined;
  }
  return `${candidate}-panel-height-probe`;
};

function measureInstantly(node) {
  if (!node || typeof node.getBoundingClientRect !== "function") {
    return null;
  }
  const rect = node.getBoundingClientRect();
  return sanitizeHeight(rect?.height ?? null);
}

function useStableSettingsPanelHeight({
  sections,
  activeSectionId,
  referenceSectionId = DEFAULT_REFERENCE_SECTION_ID,
}) {
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

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateActiveHeight(entry?.contentRect?.height ?? null);
      }
    });

    observer.observe(activePanelNode);

    return () => {
      observer.disconnect();
    };
  }, [activePanelNode, activeSectionId, applyCachedHeight, updateActiveHeight]);

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

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateReferenceHeight(entry?.contentRect?.height ?? null);
      }
    });

    observer.observe(referencePanelNode);

    return () => {
      observer.disconnect();
    };
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

  const handleActivePanelChange = useCallback(
    (node) => {
      setActivePanelNode(node ?? null);
      if (node) {
        applyCachedHeight("active", activeSectionId);
      }
    },
    [activeSectionId, applyCachedHeight],
  );

  const handleReferencePanelChange = useCallback(
    (node) => {
      setReferencePanelNode(node ?? null);
      if (node) {
        applyCachedHeight("reference", referenceSectionId);
      }
    },
    [applyCachedHeight, referenceSectionId],
  );

  const referenceSection = useMemo(
    () => sections.find((section) => section.id === referenceSectionId),
    [sections, referenceSectionId],
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
      registerNode: handleReferencePanelChange,
    };
  }, [referenceSection, handleReferencePanelChange]);

  const resolvedHeight = useMemo(() => {
    if (heightMap.reference) {
      return Math.ceil(heightMap.reference);
    }
    if (heightMap.active) {
      return Math.ceil(heightMap.active);
    }
    return null;
  }, [heightMap]);

  const bodyStyle = useMemo(() => {
    if (!resolvedHeight) {
      return undefined;
    }
    return {
      "--settings-body-height": `${resolvedHeight}px`,
    };
  }, [resolvedHeight]);

  return {
    bodyStyle,
    registerActivePanelNode: handleActivePanelChange,
    referenceMeasurement,
  };
}

export default useStableSettingsPanelHeight;
