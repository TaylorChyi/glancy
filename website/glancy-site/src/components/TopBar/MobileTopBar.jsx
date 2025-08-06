import { useLanguage } from '@/context'
import ThemeIcon from '@/components/ui/Icon'
import TopBarActions from './TopBarActions.jsx'
import common from './TopBarCommon.module.css'
import styles from './MobileTopBar.module.css'
import { getBrandText } from '@/utils'

function MobileTopBar({
  term = '',
  showBack = false,
  onBack,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  onOpenSidebar
}) {
  const { lang } = useLanguage()
  const brandText = getBrandText(lang)

  return (
    <header className={styles['mobile-topbar']}>
      <button className={styles['topbar-btn']} onClick={onOpenSidebar}>
        <ThemeIcon name="glancy-web" alt={brandText} width={24} height={24} />
      </button>
      <button
        type="button"
        className={`${common['back-btn']} ${showBack ? styles.visible : styles.hidden}`}
        onClick={onBack}
      >
        ←
      </button>
      <div className={`${common['term-text']} ${styles['term-text']}`}>{term || brandText}</div>
      <TopBarActions
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
        canFavorite={canFavorite}
      />
    </header>
  )
}

export default MobileTopBar
