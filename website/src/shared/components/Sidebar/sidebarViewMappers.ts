type NavigationState = {
  isMobile: boolean;
  isOpen: boolean;
  shouldShowOverlay: boolean;
  closeSidebar: () => void;
  navigationActions: Array<Record<string, unknown>>;
  headerLabel?: string;
  historyLabel?: string;
  entriesLabel?: string;
};

export const resolveHistoryAriaLabel = (state: NavigationState): string | undefined =>
  state.historyLabel || state.entriesLabel;

export const buildLayoutProps = (state: NavigationState) => ({
  isMobile: state.isMobile,
  open: state.isOpen,
  showOverlay: state.shouldShowOverlay,
  onOverlayClick: state.isMobile ? state.closeSidebar : undefined,
});

export const buildNavigationProps = (state: NavigationState) => ({
  items: state.navigationActions,
  ariaLabel: state.headerLabel,
});

export const buildHistoryProps = ({
  navigationState,
  onSelectHistory,
}: {
  navigationState: NavigationState;
  onSelectHistory?: (id?: string) => void;
}) => ({
  ariaLabel: resolveHistoryAriaLabel(navigationState),
  onSelectHistory,
});
