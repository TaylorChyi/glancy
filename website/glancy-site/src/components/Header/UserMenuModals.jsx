import { useState, useEffect } from 'react'
import HelpModal from '@/components/modals/HelpModal.jsx'
import SettingsModal from '@/components/modals/SettingsModal.jsx'
import ShortcutsModal from '@/components/modals/ShortcutsModal.jsx'
import ProfileModal from '@/components/modals/ProfileModal.jsx'
import UpgradeModal from '@/components/modals/UpgradeModal.jsx'
import LogoutConfirmModal from '@/components/modals/LogoutConfirmModal.jsx'

function UserMenuModals({ isPro, user, clearUser, clearHistory, children }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    const handler = () => setShortcutsOpen(true)
    document.addEventListener('open-shortcuts', handler)
    return () => document.removeEventListener('open-shortcuts', handler)
  }, [])

  const handlers = {
    openHelp: () => setHelpOpen(true),
    openSettings: () => setSettingsOpen(true),
    openShortcuts: () => setShortcutsOpen(true),
    openProfile: () => setProfileOpen(true),
    openUpgrade: () => setUpgradeOpen(true),
    openLogout: () => setLogoutOpen(true)
  }

  return (
    <>
      {children(handlers)}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      {!isPro && (
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <LogoutConfirmModal
        open={logoutOpen}
        onConfirm={() => {
          clearHistory()
          clearUser()
          setLogoutOpen(false)
        }}
        onCancel={() => setLogoutOpen(false)}
        email={user?.email || ''}
      />
    </>
  )
}

export default UserMenuModals
