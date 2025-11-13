import useCodeButtonState from "./hooks/useCodeButtonState.js";
import styles from "./AuthForm.module.css";

function CodeButton({ onClick, countdownDuration = 60 }) {
  const { handleClick, isCountingDown, isRequesting, idleLabel, countdownLabel } =
    useCodeButtonState({
      onClick,
      countdownDuration,
    });

  return (
    <button
      type="button"
      className={styles["code-btn"]}
      disabled={isCountingDown || isRequesting}
      aria-busy={isRequesting}
      onClick={handleClick}
    >
      {isCountingDown ? countdownLabel : idleLabel}
    </button>
  );
}

export default CodeButton;
