import PropTypes from "prop-types";
import PreferencesView from "./PreferencesView.jsx";
import { usePreferencesModel } from "./usePreferencesModel.ts";

function Preferences({ initialSection, renderCloseAction }) {
  const { viewProps } = usePreferencesModel({
    initialSection,
    renderCloseAction,
  });
  return <PreferencesView {...viewProps} />;
}

Preferences.propTypes = {
  initialSection: PropTypes.string,
  renderCloseAction: PropTypes.func,
};

Preferences.defaultProps = {
  initialSection: undefined,
  renderCloseAction: undefined,
};

export default Preferences;
