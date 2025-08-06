import Faq from '@/pages/faq'
import BaseModal from './BaseModal.jsx'
import styles from './HelpModal.module.css'

function HelpModal({ open, onClose }) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`modal-content ${styles['help-modal']}`}
    >
      <Faq />
    </BaseModal>
  )
}

export default HelpModal
