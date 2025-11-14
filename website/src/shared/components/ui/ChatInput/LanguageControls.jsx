import { LanguageLauncher } from "./parts";
import {
  buildLanguageLauncherProps,
  hasOptions,
  languageControlsDefaultProps,
  languageControlsPropTypes,
} from "./LanguageControls.helpers";

export default function LanguageControls(props) {
  const hasSource = hasOptions(props.sourceLanguageOptions);
  const hasTarget = hasOptions(props.targetLanguageOptions);
  if (!hasSource && !hasTarget) return null;

  const canSwap =
    hasSource && hasTarget && typeof props.onSwapLanguages === "function";

  return <LanguageLauncher {...buildLanguageLauncherProps(props, canSwap)} />;
}

LanguageControls.propTypes = languageControlsPropTypes;
LanguageControls.defaultProps = languageControlsDefaultProps;
