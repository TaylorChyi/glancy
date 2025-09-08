import { ICP_INFO } from "@/config/icp.js";
import styles from "./ICP.module.css";

function ICP({ className }) {
  const { link, text } = ICP_INFO;
  const classes = [styles.icp, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <a href={link} target="_blank" rel="noopener">
        {text}
      </a>
    </div>
  );
}

export default ICP;
