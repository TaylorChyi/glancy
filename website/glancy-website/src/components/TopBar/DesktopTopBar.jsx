import styles from './DesktopTopBar.module.css'
import common from './TopBarCommon.module.css'
import TopBarActions from './TopBarActions.jsx'
import { TtsButton } from '@/components'

function DesktopTopBar({
  term = '',
  lang,
  showBack = false,
  onBack,
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
}) {

  return (
    <header className={styles['desktop-topbar']}>
      <button
        type="button"
        className={`${common['back-btn']} ${showBack ? styles.visible : styles.hidden}`}
        onClick={onBack}
      >
        ←
      </button>
      <div className={`${common['term-text']} ${styles['term-text']}`}>
        <span className={styles['term-label']}>{term}</span>
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

export default DesktopTopBar
