/**
 * 背景：
 *  - SettingsModal 与 Preferences 页面在切换分区时存在高度跳动，
 *    旧实现通过固定 modal 高度缓解但无法兼顾不同内容实际占用。
 * 目的：
 *  - 采用观察者 + 参考面板策略，对 Data Controls 等基准分区进行隐藏测量，
 *    将其高度同步到容器 CSS 变量，确保所有分区共享一致高度基线。
 * 关键决策与取舍：
 *  - 选择 ResizeObserver 监听真实 DOM 而非手写估算，避免未来内容变化需手动维护；
 *  - 参考面板采用隐藏渲染并复用组件 props，保证测量与实际展示等价；
 *  - 当参考面板不可用时回退到当前激活分区，保障极端场景下仍具备合理高度。
 * 影响范围：
 *  - SettingsBody 的高度控制、SettingsModal 与 Preferences 页面布局稳定性。
 * 演进与TODO：
 *  - TODO: 后续可接入缓存机制，避免多次计算相同高度；
 *  - TODO: 若引入动画过渡，可在此扩展高度平滑过渡逻辑。
 */
import { useCallback, useEffect, useMemo, useState } from "react";

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

  const updateHeight = useCallback((type, heightValue) => {
    setHeightMap((current) => {
      const normalized = sanitizeHeight(heightValue);
      if (current[type] === normalized) {
        return current;
      }
      return { ...current, [type]: normalized };
    });
  }, []);

  useEffect(() => {
    if (!activePanelNode) {
      updateHeight("active", null);
      return undefined;
    }

    if (typeof ResizeObserver === "undefined") {
      updateHeight("active", measureInstantly(activePanelNode));
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateHeight("active", entry?.contentRect?.height ?? null);
      }
    });

    observer.observe(activePanelNode);

    return () => {
      observer.disconnect();
    };
  }, [activePanelNode, activeSectionId, updateHeight]);

  useEffect(() => {
    if (!referencePanelNode) {
      updateHeight("reference", null);
      return undefined;
    }

    if (typeof ResizeObserver === "undefined") {
      updateHeight("reference", measureInstantly(referencePanelNode));
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateHeight("reference", entry?.contentRect?.height ?? null);
      }
    });

    observer.observe(referencePanelNode);

    return () => {
      observer.disconnect();
    };
  }, [referencePanelNode, referenceSectionId, updateHeight]);

  const handleActivePanelChange = useCallback((node) => {
    setActivePanelNode(node ?? null);
  }, []);

  const handleReferencePanelChange = useCallback((node) => {
    setReferencePanelNode(node ?? null);
  }, []);

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
