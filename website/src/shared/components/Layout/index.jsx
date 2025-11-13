import PropTypes from "prop-types";
import LayoutView from "./LayoutView.jsx";
import { useLayoutModel } from "./useLayoutModel.ts";

function Layout({ children, sidebarProps, bottomContent, onMainMiddleScroll }) {
  const { viewProps } = useLayoutModel({
    children,
    sidebarProps,
    bottomContent,
    onMainMiddleScroll,
  });
  return <LayoutView {...viewProps} />;
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  sidebarProps: PropTypes.object,
  bottomContent: PropTypes.node,
  onMainMiddleScroll: PropTypes.func,
};

Layout.defaultProps = {
  sidebarProps: {},
  bottomContent: null,
  onMainMiddleScroll: undefined,
};

export default Layout;
