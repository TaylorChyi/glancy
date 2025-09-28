import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useUser } from "@/context";
import Toast from "@/components/ui/Toast";
import NavItem from "./NavItem.jsx";
import styles from "./HistoryList.module.css";

function HistoryList({ onSelect }) {
  const { history, loadHistory, error } = useHistory();
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user?.token) return;
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!error) return;
    setErrorMessage(error);
  }, [error]);

  const handleToastClose = () => {
    setErrorMessage("");
  };

  const groupedHistory = useMemo(() => history ?? [], [history]);
  const hasHistory = groupedHistory.length > 0;

  const handleSelect = (item) => {
    if (!onSelect) return;
    const versionId = item?.latestVersionId ?? undefined;
    onSelect(item, versionId);
  };

  return (
    <>
      {hasHistory ? (
        <ul className={styles.list}>
          {groupedHistory.map((item) => (
            <li key={item.termKey} className={styles.item}>
              <NavItem label={item.term} onClick={() => handleSelect(item)} />
            </li>
          ))}
        </ul>
      ) : null}
      <Toast
        open={!!errorMessage}
        message={errorMessage}
        onClose={handleToastClose}
      />
    </>
  );
}

HistoryList.propTypes = {
  onSelect: PropTypes.func,
};

export default HistoryList;
