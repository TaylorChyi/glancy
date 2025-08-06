import { ICP_INFO } from '@/config/icp.js'
import styles from './ICP.module.css'

function ICP() {
  const { link, text } = ICP_INFO
  return (
    <div className={styles.icp}>
      <a href={link} target="_blank" rel="noopener">
        {text}
      </a>
    </div>
  )
}

export default ICP
