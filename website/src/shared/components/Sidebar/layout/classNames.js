export const getSidebarClassName = ({ isMobile, open, containerClass }) => {
  const mobileClass = isMobile ? (open ? " mobile-open" : "") : "";
  return `sidebar${mobileClass} ${containerClass}`;
};

export default getSidebarClassName;
