import React from "react";
import PropTypes from "prop-types";
import styles from "./ListItem.module.css";

const deriveTitle = (title, text) =>
  typeof title === "string"
    ? title
    : typeof text === "string"
      ? text
      : undefined;

function ListItem({
  text,
  title,
  icon,
  onClick,
  actions,
  className = "",
  textClassName = "",
  isActive = false,
  ...props
}) {
  const itemClassName = [styles.item, className].filter(Boolean).join(" ");
  return (
    <li
      className={itemClassName}
      data-active={isActive || undefined}
      onClick={onClick}
      {...props}
    >
      <span className={styles.indicator} aria-hidden="true" />
      <span className={styles.icon} aria-hidden={icon ? undefined : "true"}>
        {icon || null}
      </span>
      <span
        className={[styles.text, textClassName].filter(Boolean).join(" ")}
        title={deriveTitle(title, text)}
      >
        {text}
      </span>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </li>
  );
}

ListItem.propTypes = {
  text: PropTypes.node,
  title: PropTypes.string,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  actions: PropTypes.node,
  className: PropTypes.string,
  textClassName: PropTypes.string,
  isActive: PropTypes.bool,
};

export default ListItem;
