import { useCallback, useEffect, useMemo, useRef } from "react";

const createHandlePointerDown = (rootRef, closeMenu) => (event) => {
  if (!rootRef.current?.contains(event.target)) {
    closeMenu();
  }
};

const createHandleMenuAction = (closeMenu) => (callback) => () => {
  if (typeof callback === "function") {
    callback();
  }
  closeMenu();
};

const buildPrimaryItems = ({
  isPro,
  translate,
  onOpenSettings,
  onOpenUpgrade,
}) => {
  const primaryItems = [
    {
      key: "settings",
      icon: "cog-6-tooth",
      label: translate("settings", "Settings"),
      action: onOpenSettings,
      tone: "default",
    },
  ];

  if (!isPro) {
    primaryItems.unshift({
      key: "upgrade",
      icon: "shield-check",
      label: translate("upgrade", "Upgrade"),
      action: onOpenUpgrade,
      tone: "default",
    });
  }

  return primaryItems;
};

const buildExitItems = ({ translate, onOpenLogout }) => [
  {
    key: "logout",
    icon: "arrow-right-on-rectangle",
    label: translate("logout", "Logout"),
    action: onOpenLogout,
    tone: "danger",
  },
];

export const useMenuClose = (open, setOpen) => {
  const rootRef = useRef(null);
  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = createHandlePointerDown(rootRef, closeMenu);

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, closeMenu]);

  const handleMenuAction = useMemo(
    () => createHandleMenuAction(closeMenu),
    [closeMenu],
  );

  return { rootRef, handleMenuAction };
};

export const useTranslationResolver = (t) =>
  useCallback(
    (key, fallback) =>
      t && typeof t === "object" && t[key] ? t[key] : fallback,
    [t],
  );

export const useMenuSections = ({
  isPro,
  translate,
  onOpenSettings,
  onOpenUpgrade,
  onOpenLogout,
}) =>
  useMemo(() => {
    const primaryItems = buildPrimaryItems({
      isPro,
      translate,
      onOpenSettings,
      onOpenUpgrade,
    });
    const exitItems = buildExitItems({ translate, onOpenLogout });

    return [
      { key: "primary", items: primaryItems },
      { key: "exit", items: exitItems },
    ];
  }, [isPro, onOpenLogout, onOpenSettings, onOpenUpgrade, translate]);
