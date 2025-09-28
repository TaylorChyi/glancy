import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useHistory, useUser } from "@/context";
import Toast from "@/components/ui/Toast";
import NavItem from "./NavItem.jsx";
import styles from "./HistoryList.module.css";

function HistoryList({ onSelect }) {
  const { history, loadHistory, error } = useHistory();
  const { user } = useUser();
  const [errorMessage, setErrorMessage] = useState("");
  const itemRefs = useRef([]);

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

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, groupedHistory.length);
  }, [groupedHistory.length]);

  const handleSelect = (item) => {
    if (!onSelect) return;
    const versionId = item?.latestVersionId ?? undefined;
    onSelect(item, versionId);
  };

  const focusItemAt = (index) => {
    const target = itemRefs.current[index];
    if (target) {
      target.focus();
    }
  };

  const handleItemKeyDown = (event, index) => {
    if (groupedHistory.length === 0) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        focusItemAt(Math.min(index + 1, groupedHistory.length - 1));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        focusItemAt(Math.max(index - 1, 0));
        break;
      }
      case "Home": {
        event.preventDefault();
        focusItemAt(0);
        break;
      }
      case "End": {
        event.preventDefault();
        focusItemAt(groupedHistory.length - 1);
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      {hasHistory ? (
        <ul className={styles.list} role="listbox">
          {groupedHistory.map((item, index) => (
            <li key={item.termKey} className={styles.item} role="presentation">
              <NavItem
                label={item.term}
                onClick={() => handleSelect(item)}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                onKeyDown={(event) => handleItemKeyDown(event, index)}
              />
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
