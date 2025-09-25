import { useLanguage } from "@/context";
import { UserMenu } from "@/components/Header";
import SidebarActionItem from "@/components/Sidebar/SidebarActionItem.jsx";
import { SIDEBAR_ACTION_VARIANTS } from "@/components/Sidebar/sidebarActionVariants.js";
import { getBrandText } from "@/utils";

function Brand() {
  const { lang } = useLanguage();
  const brandText = getBrandText(lang);

  const handleClick = () => {
    window.location.reload();
  };

  return (
    <div className="sidebar-brand">
      <SidebarActionItem
        icon="glancy-web"
        iconAlt={brandText}
        label={brandText}
        onClick={handleClick}
        variant={SIDEBAR_ACTION_VARIANTS.prominent}
      />
      <div className="mobile-user-menu">
        <UserMenu size={28} />
      </div>
    </div>
  );
}

export default Brand;
