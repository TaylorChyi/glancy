import { useLanguage } from '@/context'
import ThemeIcon from '@/components/ui/Icon'
import { UserMenu } from '@/components/Header'
import { getBrandText } from '@/utils'

function Brand() {
  const { lang } = useLanguage()
  const brandText = getBrandText(lang)

  const handleClick = () => {
    window.location.reload()
  }

  return (
    <div className="sidebar-brand">
      <div className="brand-main" onClick={handleClick}>
        <ThemeIcon name="glancy-web" alt={brandText} />
        <span>{brandText}</span>
      </div>
      <div className="mobile-user-menu">
        <UserMenu size={28} />
      </div>
    </div>
  )
}

export default Brand
