import { cloneElement, isValidElement } from "react";
import styles from "./Form.module.css";

function FormRow({ label, id, children, className = "" }) {
  const cls = [styles.row, className].filter(Boolean).join(" ");
  const content =
    isValidElement(children) && id && !children.props.id
      ? cloneElement(children, { id })
      : children;

  return (
    <div className={cls}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {content}
    </div>
  );
}

export default FormRow;
