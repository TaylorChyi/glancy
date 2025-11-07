import ICP from "./ICP.jsx";
import useDockedICPVisibility from "./useDockedICPVisibility.js";
import styles from "./DockedICP.module.css";

function DockedICP() {
  const { isVisible, reveal } = useDockedICPVisibility();
  const containerState = isVisible ? "visible" : "hidden";

  return (
    <div className={styles.host}>
      <div
        className={styles.container}
        data-testid="icp-docked-container"
        data-state={containerState}
        aria-hidden={!isVisible}
      >
        <div className={styles.panel} data-state={containerState}>
          <ICP />
        </div>
      </div>
      <div
        className={styles["reveal-handle"]}
        data-testid="icp-reveal-handle"
        aria-hidden="true"
        onPointerEnter={reveal}
        onMouseEnter={reveal}
      />
    </div>
  );
}

export default DockedICP;
