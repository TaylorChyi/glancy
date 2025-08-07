import Profile from '@/pages/profile'
import BaseModal from './BaseModal.jsx'
import styles from './ProfileModal.module.css'

function ProfileModal({ open, onClose }) {
  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`modal-content ${styles['profile-modal']}`}
    >
      <Profile onCancel={onClose} />
    </BaseModal>
  )
}

export default ProfileModal
