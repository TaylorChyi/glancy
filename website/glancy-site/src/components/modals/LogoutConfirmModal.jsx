import BaseModal from './BaseModal.jsx'
import styles from './LogoutConfirmModal.module.css'
import { useLanguage } from '@/context'

function LogoutConfirmModal({ open, onConfirm, onCancel, email }) {
  const { t } = useLanguage()
  const message = t.logoutConfirmMessage.replace('{email}', email)
  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      className={`modal-content ${styles['logout-modal']}`}
    >
      <h3>{t.logoutConfirmTitle}</h3>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles['logout-btn']} onClick={onConfirm}>
          {t.logout}
        </button>
        <button type="button" className={styles['cancel-btn']} onClick={onCancel}>
          {t.cancelButton}
        </button>
      </div>
    </BaseModal>
  )
}

export default LogoutConfirmModal
