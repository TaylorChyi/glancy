import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CollectionButton from "./CollectionButton.jsx";
import { useLanguage } from "@/context";
import styles from "./Sidebar.module.css";

const GOMEMO_PATH = "/gomemo";
const FALLBACK_GOMEMO_LABEL = "Gomemo";

function GomemoEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const gomemoLabel = t.gomemo || FALLBACK_GOMEMO_LABEL;
  const gomemoIconAlt = t.gomemoIconAlt || gomemoLabel;
  const gomemoTagline = t.gomemoTagline || "";

  const sectionClassName = useMemo(
    () =>
      [styles["sidebar-section"], styles["sidebar-hoverable"]]
        .filter(Boolean)
        .join(" "),
    [],
  );

  const isActive = location.pathname.startsWith(GOMEMO_PATH);

  const handleNavigate = useCallback(() => {
    if (location.pathname !== GOMEMO_PATH) {
      navigate(GOMEMO_PATH);
    }
  }, [location.pathname, navigate]);

  return (
    <div className={sectionClassName}>
      <CollectionButton
        icon="target"
        label={gomemoLabel}
        iconAlt={gomemoIconAlt}
        isActive={isActive}
        onClick={handleNavigate}
      />
      {gomemoTagline && (
        <p className={styles["collection-note"]}>{gomemoTagline}</p>
      )}
    </div>
  );
}

export default GomemoEntry;
