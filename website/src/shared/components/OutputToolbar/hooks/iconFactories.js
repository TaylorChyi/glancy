import { createElement } from "react";

import ThemeIcon from "@shared/components/ui/Icon";

const createThemeIconFactory = (name, size) => () =>
  createElement(ThemeIcon, {
    name,
    width: size,
    height: size,
  });

const COPY_ICON_FACTORY = Object.freeze({
  success: createThemeIconFactory("copy-success", 20),
  default: createThemeIconFactory("copy", 20),
});

const DELETE_ICON_FACTORY = createThemeIconFactory("trash", 20);
const REPORT_ICON_FACTORY = createThemeIconFactory("flag", 20);

export const ICON_FACTORIES = Object.freeze({
  copy: COPY_ICON_FACTORY,
  delete: DELETE_ICON_FACTORY,
  report: REPORT_ICON_FACTORY,
});

export const resolveCopyIcon = (isSuccess) =>
  (isSuccess ? COPY_ICON_FACTORY.success : COPY_ICON_FACTORY.default)();

export const resolveDeleteIcon = () => DELETE_ICON_FACTORY();

export const resolveReportIcon = () => REPORT_ICON_FACTORY();
