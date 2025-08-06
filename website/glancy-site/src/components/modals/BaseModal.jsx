import Modal from './Modal.jsx'

function BaseModal({ open, onClose, className = '', children }) {
  if (!open) return null

  return (
    <Modal onClose={onClose} className={className}>
      {children}
    </Modal>
  )
}

export default BaseModal
