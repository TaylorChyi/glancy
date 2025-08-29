import ThemeIcon from '@/components/ui/Icon'
import TopBarActions from './TopBarActions.jsx'
import common from './TopBarCommon.module.css'
import styles from './MobileTopBar.module.css'
import { getBrandText } from '@/utils'
import { TtsButton } from '@/components'

function MobileTopBar({
  term = '',
  lang,
  showBack = false,
  onBack,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
  onOpenSidebar,
}) {
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
      <div className={`${common['term-text']} ${styles['term-text']}`}>
        <span className={styles['term-label']}>{term || brandText}</span>
        {term && <TtsButton text={term} lang={lang} size={20} />}
      </div>
      <TopBarActions
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
        canFavorite={canFavorite}
      />
    </header>
  )
}

export default MobileTopBar
