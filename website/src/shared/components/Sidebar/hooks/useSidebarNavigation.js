import { useLanguage } from "@core/context";
// 避免通过 utils/index 的桶状导出造成 rollup chunk 循环，直接引用具体实现。
import { useIsMobile } from "@shared/utils/device.js";
import useNavAccess from "./useNavAccess.js";
import useNavItems from "./useNavItems.js";
import useSidebarLabels from "./useSidebarLabels.js";
import useNavigationHandlers from "./useNavigationHandlers.js";
import useSidebarOpenState from "./useSidebarOpenState.js";

/**
 * 意图：集中管理侧边栏导航所需的状态、文案与回调，输出给展示组件。
 * 输入：调用方可透传是否移动端、开闭状态、关闭回调、两个业务动作以及当前激活视图。
 * 输出：返回移动端开闭状态、导航按钮配置、分组辅助文案以及开闭控制方法。
 * 流程：
 *  1) 根据上下文语言环境推导导航、历史、词条等文案。
 *  2) 依据是否受控决定开闭状态维护方式。
 *  3) 生成导航按钮数组，统一处理点击后的收起逻辑。
 * 错误处理：无额外错误分支，全部依赖调用方传入的回调。
 * 复杂度：O(1)，只进行常量级计算。
 */
export default function useSidebarNavigation(options) {
  const presentation = useSidebarPresentation(options);
  const actions = useSidebarLabelsAndActions({
    isMobile: presentation.isMobile,
    closeSidebar: presentation.closeSidebar,
    onShowDictionary: options.onShowDictionary,
    onShowLibrary: options.onShowLibrary,
    activeView: options.activeView,
  });
  return { ...presentation, ...actions };
}

function useSidebarPresentation({ isMobile: isMobileProp, open: openProp, onClose }) {
  const defaultMobile = useIsMobile();
  const isMobile = isMobileProp ?? defaultMobile;
  const { isOpen, closeSidebar, openSidebar } = useSidebarOpenState({
    open: openProp,
    onClose,
  });
  return {
    isMobile,
    isOpen,
    shouldShowOverlay: isMobile && isOpen,
    openSidebar,
    closeSidebar,
  };
}

function useSidebarLabelsAndActions({
  isMobile,
  closeSidebar,
  onShowDictionary,
  onShowLibrary,
  activeView,
}) {
  const { access, labels } = useSidebarLabelResources();
  const navigationHandlers = useNavigationHandlers({
    isMobile,
    closeSidebar,
    onShowDictionary,
    onShowLibrary,
  });
  const navigationActions = useNavigationActions({
    access,
    labels: getNavigationLabels(labels),
    handlers: getNavigationHandlers(navigationHandlers),
    activeView,
  });
  return {
    headerLabel: labels.headerLabel,
    historyLabel: labels.historyLabel,
    entriesLabel: labels.entriesLabel,
    navigationActions,
  };
}

function useSidebarLabelResources() {
  const { t, lang } = useLanguage();
  const access = useNavAccess();
  const labels = useSidebarLabels({ t, lang });
  return { access, labels };
}

function useNavigationActions(params) {
  return useNavItems(params);
}

function getNavigationLabels(labels) {
  return {
    dictionary: labels.dictionaryLabel,
    library: labels.libraryLabel,
  };
}

function getNavigationHandlers(navigationHandlers) {
  return {
    onDictionary: navigationHandlers.handleDictionary,
    onLibrary: navigationHandlers.handleLibrary,
  };
}
