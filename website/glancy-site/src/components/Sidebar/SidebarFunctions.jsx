import Favorites from './Favorites.jsx'
import HistoryList from './HistoryList.jsx'
import { useUser } from '@/context'
import styles from './Sidebar.module.css'

function SidebarFunctions({ onToggleFavorites, onSelectHistory }) {
  const { user } = useUser()
  return (
    <div className={styles['sidebar-functions']}>
      {user && <Favorites onToggle={onToggleFavorites} />}
      <HistoryList onSelect={onSelectHistory} />
    </div>
  )
}

export default SidebarFunctions
