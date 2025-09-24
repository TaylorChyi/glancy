import React from "react";
import styles from "./AgeStepper.module.css";

function AgeStepper({ value = 0, onChange }) {
  const handleInput = (e) => {
    const num = parseInt(e.target.value, 10);
    if (onChange) onChange(Number.isNaN(num) ? "" : num);
  };
  const dec = () => {
    const num = parseInt(value, 10) || 0;
    if (onChange) onChange(num > 0 ? num - 1 : 0);
  };
  const inc = () => {
    const num = parseInt(value, 10) || 0;
    if (onChange) onChange(num + 1);
  };
  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.control} onClick={dec}>
        -
      </button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={handleInput}
        className={styles.input}
      />
      <button type="button" className={styles.control} onClick={inc}>
        +
      </button>
    </div>
  );
}

export default AgeStepper;
