import { UserMenu } from "@/components/Header";
import ICP from "@/components/ui/ICP";
import styles from "./Sidebar.module.css";

function SidebarUser() {
  return (
    <div className={styles["sidebar-user"]}>
      <UserMenu size={32} showName />
      <ICP className={styles["sidebar-icp"]} />
    </div>
  );
}

export default SidebarUser;
