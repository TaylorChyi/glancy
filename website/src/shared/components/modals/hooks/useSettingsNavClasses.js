import { useMemo } from "react";

const DEFAULT_CLASSES = {
  container: "",
  action: "",
  nav: "",
  button: "",
  label: "",
  labelText: "",
  icon: "",
  actionButton: "",
};

export const useSettingsNavClasses = (classes) =>
  useMemo(() => ({ ...DEFAULT_CLASSES, ...classes }), [classes]);
