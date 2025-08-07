import styles from './Modal.module.css'
import { useEscapeKey } from '@/hooks'
import { withStopPropagation } from '@/utils/stopPropagation.js'

function Modal({ onClose, className = '', children }) {
  useEscapeKey(onClose)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={className} onClick={withStopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default Modal
