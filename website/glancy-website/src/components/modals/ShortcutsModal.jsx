import BaseModal from './BaseModal.jsx'
import styles from './ShortcutsModal.module.css'
import { getModifierKey } from '@/utils/device.js'
import { useLanguage } from '@/context'

function ShortcutsModal({ open, onClose }) {
  const { t } = useLanguage()
  const mod = getModifierKey()
  const shortcuts = [
    { keys: `${mod} + Shift + F`, action: t.shortcutsFocusSearch },
    { keys: `${mod} + Shift + L`, action: t.shortcutsSwitchLanguage },
    { keys: `${mod} + Shift + M`, action: t.shortcutsToggleTheme },
    { keys: `${mod} + Shift + B`, action: t.shortcutsToggleFavorite },
    { keys: `${mod} + Shift + K`, action: t.shortcutsOpenHelp },
  ]

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      className={`modal-content ${styles['shortcuts-modal']}`}
    >
      <h3>{t.shortcutsTitle}</h3>
      <ul>
        {shortcuts.map((s) => (
          <li key={s.keys}>
            <span className={styles.keys}>{s.keys}</span>
            <span className={styles.desc}>{s.action}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose} className={styles['close-btn']}>
        {t.close}
      </button>
    </BaseModal>
  )
}

export default ShortcutsModal
