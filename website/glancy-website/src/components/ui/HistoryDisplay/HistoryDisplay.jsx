import { useHistory } from '@/context'
import styles from './HistoryDisplay.module.css'

function HistoryDisplay() {
  const { history } = useHistory()
  if (!history.length) {
    return (
      <div className="display-content">
        <div className="display-term">No history</div>
      </div>
    )
  }
  return (
    <ul className={styles['history-grid-display']}>
      {history.map((h, i) => (
        <li key={i}>{h}</li>
      ))}
    </ul>
  )
}

export default HistoryDisplay
