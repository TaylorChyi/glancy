import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context";
import SidebarActionItem from "./SidebarActionItem.jsx";

const GOMEMO_PATH = "/gomemo";
const FALLBACK_GOMEMO_LABEL = "Gomemo";

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
      icon="target"
      iconAlt={gomemoIconAlt}
      label={gomemoLabel}
      isActive={isActive}
      onClick={handleNavigate}
    />
  );
}

export default GomemoEntry;
