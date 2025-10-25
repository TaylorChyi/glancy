/**
 * 背景：
 *  - 分享菜单需要在工具栏内部维持键盘可达性与访问控制，历史实现将这些状态杂糅在组件中。
 * 目的：
 *  - 抽离共享菜单的状态机，统一管理开启/关闭、能力判定与导航托管。
 * 关键决策与取舍：
 *  - 采用有限状态机的 Hook 封装（状态模式的实现），使主组件仅消费派生状态而非直接控制 ref；
 *  - 保留向 useMenuNavigation 的委托，延续现有的焦点管理策略。
 * 影响范围：
 *  - OutputToolbar 及潜在复用分享交互的组件。
 * 演进与TODO：
 *  - 后续可在此扩展动画策略或权限校验日志。
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import useMenuNavigation from "@shared/hooks/useMenuNavigation.js";

const deriveCapabilities = (shareModel) => {
  if (!shareModel || typeof shareModel !== "object") return null;
  const {
    canShare: shareEnabled = true,
    onCopyLink,
    onExportImage,
    isImageExporting = false,
    canExportImage = true,
    shareUrl: shareTarget,
  } = shareModel;
  return {
    hasCopy: typeof onCopyLink === "function",
    hasImage: typeof onExportImage === "function",
    onCopyLink,
    onExportImage,
    isImageExporting: Boolean(isImageExporting),
    canExportImage: Boolean(canExportImage),
    canShare: shareEnabled !== false,
    shareUrl: shareTarget,
  };
};

const resolveAccess = (canShare, capabilities) => {
  if (typeof canShare === "boolean") {
    return canShare;
  }
  if (capabilities) {
    return capabilities.canShare !== false;
  }
  return false;
};

const shouldDisableShare = ({ disabled, accessGranted, available }) =>
  disabled || !accessGranted || !available;

/**
 * 意图：
 *  - 汇总分享菜单的开启条件、能力矩阵与交互回调。
 * 输入：
 *  - shareModel: 分享配置对象；
 *  - canShare: 父级显式控制分享可用性；
 *  - disabled: 工具栏总禁用态。
 * 输出：
 *  - 包含 capabilities、按钮禁用态、键盘事件回调等。
 * 流程：
 *  1) 解析 shareModel 得到分享能力矩阵；
 *  2) 结合 canShare 与 disabled 判定按钮可用性；
 *  3) 委托 useMenuNavigation 管理焦点；
 *  4) 暴露开关回调供展示层调用。
 * 错误处理：
 *  - 对非法 shareModel 返回 null，按钮会被禁用。
 * 复杂度：
 *  - 常数级，主要依赖 useMemo 缓存。
 */
export function useShareMenuState({ shareModel, canShare, disabled }) {
  const shareTriggerRef = useRef(null);
  const shareTriggerFallbackRef = useRef(null);
  const shareMenuRef = useRef(null);
  const [isOpen, setOpen] = useState(false);
  const menuId = useId();

  /**
   * 背景：
   *  - React 在提交阶段会先将旧 ref 置空再写入新节点，
   *    若此瞬间触发全局 pointerdown，Popover 会误判为“点在外部”并立刻关闭。
   * 目的：
   *  - 持久化最近一次有效的触发器节点，保障在 ref 短暂为 null 时仍能识别点击来源，
   *    避免出现“菜单瞬间弹出又消失”的错觉。
   * 关键决策与取舍：
   *  - 采用回调 ref 记录实时节点与兜底节点，既不侵入调用方，也保持 DOM 引用准确；
   *  - 在组件卸载时主动清理引用，防止持有已销毁节点导致内存泄露。
   */
  const registerShareTrigger = useCallback((node) => {
    shareTriggerRef.current = node;
    if (node) {
      shareTriggerFallbackRef.current = node;
    }
  }, []);

  useEffect(
    () => () => {
      shareTriggerRef.current = null;
      shareTriggerFallbackRef.current = null;
    },
    [],
  );

  const anchorBoundaryRef = useMemo(() => {
    const boundaryRef = {};
    Object.defineProperty(boundaryRef, "current", {
      get: () => shareTriggerRef.current ?? shareTriggerFallbackRef.current,
    });
    return boundaryRef;
  }, []);

  const capabilities = useMemo(
    () => deriveCapabilities(shareModel),
    [shareModel],
  );

  const available = Boolean(
    capabilities && (capabilities.hasCopy || capabilities.hasImage),
  );

  const accessGranted = useMemo(
    () => resolveAccess(canShare, capabilities),
    [canShare, capabilities],
  );

  const buttonDisabled = shouldDisableShare({
    disabled,
    accessGranted,
    available,
  });

  useMenuNavigation(isOpen, shareMenuRef, shareTriggerRef, setOpen);

  useEffect(() => {
    if (!available || buttonDisabled) {
      setOpen(false);
    }
  }, [available, buttonDisabled]);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (buttonDisabled) return;
    setOpen((open) => !open);
  }, [buttonDisabled]);

  const handleTriggerKeyDown = useCallback(
    (event) => {
      if (buttonDisabled) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true);
      }
    },
    [buttonDisabled],
  );

  return {
    capabilities,
    available,
    isOpen,
    buttonDisabled,
    handleTriggerClick,
    handleTriggerKeyDown,
    closeMenu,
    shareTriggerRef,
    registerShareTrigger,
    anchorBoundaryRef,
    shareMenuRef,
    menuId,
  };
}
