import { forwardRef } from "react";
import PropTypes from "prop-types";
import SidebarLayout from "./layout/SidebarLayout.jsx";
import NavigationRegion from "./parts/NavigationRegion.jsx";
import HistoryRegion from "./parts/HistoryRegion.jsx";
import FooterRegion from "./parts/FooterRegion.jsx";

const SidebarView = forwardRef(function SidebarView(
  { layout, navigation, history, footer },
  ref,
) {
  return (
    <SidebarLayout
      ref={ref}
      isMobile={layout.isMobile}
      open={layout.open}
      showOverlay={layout.showOverlay}
      onOverlayClick={layout.onOverlayClick}
      navigation={<NavigationRegion {...navigation} />}
      historyAriaLabel={history.ariaLabel}
      historySection={<HistoryRegion onSelectHistory={history.onSelectHistory} />}
      footerSection={<FooterRegion {...footer} />}
    />
  );
});

SidebarView.propTypes = {
  layout: PropTypes.shape({
    isMobile: PropTypes.bool.isRequired,
    open: PropTypes.bool.isRequired,
    showOverlay: PropTypes.bool.isRequired,
    onOverlayClick: PropTypes.func,
  }).isRequired,
  navigation: PropTypes.shape({
    items: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    ariaLabel: PropTypes.string,
  }).isRequired,
  history: PropTypes.shape({
    ariaLabel: PropTypes.string,
    onSelectHistory: PropTypes.func,
  }).isRequired,
  footer: PropTypes.shape({}),
};

SidebarView.defaultProps = {
  footer: {},
};

export default SidebarView;
