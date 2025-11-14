import { useLanguage } from "@core/context";
import { useSettingsNavClasses } from "./useSettingsNavClasses";
import { useSettingsNavCloseAction } from "./useSettingsNavCloseAction";
import { useSettingsNavOrientation } from "./useSettingsNavOrientation";

export const useSettingsNavContext = ({ classes, renderCloseAction }) => {
  const { lang } = useLanguage();
  const { orientation, isHorizontalLayout } = useSettingsNavOrientation();
  const classNames = useSettingsNavClasses(classes);
  const closeActionNode = useSettingsNavCloseAction(
    renderCloseAction,
    classNames.actionButton,
  );

  return {
    lang,
    orientation,
    isHorizontalLayout,
    classNames,
    closeActionNode,
  };
};
