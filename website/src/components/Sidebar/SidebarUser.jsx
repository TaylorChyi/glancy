import { UserMenu } from "@/components/Header";
import styles from "./Sidebar.module.css";

function SidebarUser() {
  const sidebarUserClassName = [
    styles["sidebar-user"],
    styles["sidebar-hoverable"],
  ].join(" ");
  return (
    <div className={sidebarUserClassName}>
      <UserMenu size={32} showName />
    </div>
  );
}

export default SidebarUser;
