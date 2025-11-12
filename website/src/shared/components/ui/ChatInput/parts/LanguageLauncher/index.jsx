import PropTypes from "prop-types";
import useLanguageLauncher from "../../hooks/useLanguageLauncher.ts";
import { useVariantOpenHandlers } from "./hooks/useVariantOpenHandlers.js";
import { useHoverDismissController } from "./hooks/useHoverDismissController.js";
import { createLauncherViewModel } from "./viewModel/createLauncherViewModel.js";
import LanguageLauncherView from "./components/LanguageLauncherView.jsx";

export default function LanguageLauncher(props) {
  const openHandlers = useVariantOpenHandlers(props.onMenuOpen);
  const viewModel = createLauncherViewModel(props, openHandlers);
  const state = useLanguageLauncher(viewModel.params);
  const hoverGuards = useHoverDismissController(state.handleClose);

  if (state.variants.length === 0) {
    return null;
  }

  return (
    <LanguageLauncherView
      groupLabel={viewModel.groupLabel}
      hoverGuards={hoverGuards}
      state={state}
      swapAction={viewModel.swapAction}
    />
  );
}

LanguageLauncher.propTypes = {
  sourceLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  sourceLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  sourceLanguageLabel: PropTypes.string,
  onSourceLanguageChange: PropTypes.func,
  targetLanguage: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
  targetLanguageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.symbol]),
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
  targetLanguageLabel: PropTypes.string,
  onTargetLanguageChange: PropTypes.func,
  onSwapLanguages: PropTypes.func,
  swapLabel: PropTypes.string,
  normalizeSourceLanguage: PropTypes.func,
  normalizeTargetLanguage: PropTypes.func,
  onMenuOpen: PropTypes.func,
};

LanguageLauncher.defaultProps = {
  sourceLanguage: undefined,
  sourceLanguageOptions: [],
  sourceLanguageLabel: undefined,
  onSourceLanguageChange: undefined,
  targetLanguage: undefined,
  targetLanguageOptions: [],
  targetLanguageLabel: undefined,
  onTargetLanguageChange: undefined,
  onSwapLanguages: undefined,
  swapLabel: undefined,
  normalizeSourceLanguage: undefined,
  normalizeTargetLanguage: undefined,
  onMenuOpen: undefined,
};
