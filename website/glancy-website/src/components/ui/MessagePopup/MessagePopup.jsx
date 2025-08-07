import styles from './MessagePopup.module.css'
import { useEscapeKey } from '@/hooks'
import { withStopPropagation } from '@/utils/stopPropagation.js'

function MessagePopup({ open, message, onClose }) {
  useEscapeKey(onClose, open)

  if (!open) return null
  return (
    <div className={styles['popup-overlay']} onClick={onClose}>
      <div className={styles.popup} onClick={withStopPropagation()}>
        <div>{message}</div>
        <button
          type="button"
          onClick={onClose}
          className={styles['close-btn']}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default MessagePopup
