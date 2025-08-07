import BaseModal from './BaseModal.jsx'
import styles from './PaymentModal.module.css'
import { useLanguage } from '@/context'

function PaymentModal({ open, onClose }) {
  const { t } = useLanguage()
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`modal-content ${styles['payment-modal']}`}
    >
      <h3>{t.paymentTitle}</h3>
      <div className={styles.methods}>
        <button type="button">{t.alipay}</button>
        <button type="button">{t.wechat}</button>
      </div>
      <button type="button" onClick={onClose} className={styles['close-btn']}>
        {t.close}
      </button>
    </BaseModal>
  )
}

export default PaymentModal
