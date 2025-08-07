import { UserMenu } from '@/components/Header'
import styles from './Sidebar.module.css'

function SidebarUser() {
  return (
    <div className={styles['sidebar-user']}>
      <UserMenu size={32} showName />
    </div>
  )
}

export default SidebarUser
