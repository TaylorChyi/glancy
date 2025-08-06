import ThemeIcon from '@/components/ui/Icon'
import styles from './Header.module.css'

function ProTag({ small }) {
  const className = small ? styles['pro-tag-small'] : styles['pro-tag']
  return <ThemeIcon name="pro-tag" className={className} />
}

export default ProTag
