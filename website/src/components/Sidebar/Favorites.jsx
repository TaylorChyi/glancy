import { useLanguage } from '@/context'
import styles from './Sidebar.module.css'

function Favorites({ onToggle }) {
  const { t } = useLanguage()

  const handleClick = () => {
    if (onToggle) onToggle((v) => !v)
  }

  return (
    <div className={`${styles['sidebar-section']} ${styles['favorites-list']}`}>
      <h3 className={styles['collection-button']} onClick={handleClick}>
        {t.favorites || 'Favorites'}
      </h3>
    </div>
  )
}

export default Favorites
