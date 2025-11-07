import { useMemo } from "react";
import { createPanelMetadata } from "./utils/createPanelMetadata.js";

export const usePreferencePanel = ({ activeSection, modalTitle }) =>
  useMemo(
    () => createPanelMetadata({ activeSection, modalTitle }),
    [activeSection, modalTitle],
  );
