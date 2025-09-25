import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context";
import SidebarActionItem from "./SidebarActionItem.jsx";
import { SIDEBAR_ACTION_VARIANTS } from "./sidebarActionVariants.js";

const GOMEMO_PATH = "/gomemo";
const FALLBACK_GOMEMO_LABEL = "Gomemo";
const GOMEMO_ICON_NAME = "gomemo";

function GomemoEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const gomemoLabel = t.gomemo || FALLBACK_GOMEMO_LABEL;
  const gomemoIconAlt = t.gomemoIconAlt || gomemoLabel;

  const isActive = location.pathname.startsWith(GOMEMO_PATH);

  const handleNavigate = useCallback(() => {
    if (location.pathname !== GOMEMO_PATH) {
      navigate(GOMEMO_PATH);
    }
  }, [location.pathname, navigate]);

  return (
    <SidebarActionItem
      icon={GOMEMO_ICON_NAME}
      iconAlt={gomemoIconAlt}
      label={gomemoLabel}
      isActive={isActive}
      onClick={handleNavigate}
      variant={SIDEBAR_ACTION_VARIANTS.prominent}
    />
  );
}

export default GomemoEntry;
