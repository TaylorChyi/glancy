import { UserMenu } from "@/components/Header";
import SidebarUserMenuTrigger from "./SidebarUserMenuTrigger.jsx";
import styles from "./Sidebar.module.css";

function SidebarUser() {
  return (
    <div className={styles["sidebar-user"]}>
      <UserMenu size={32} showName TriggerComponent={SidebarUserMenuTrigger} />
    </div>
  );
}

export default SidebarUser;
