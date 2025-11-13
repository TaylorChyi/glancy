const MODAL_ROOT_ID = "glancy-modal-root";
let modalRoot;
let modalInstances = 0;
let previousBodyOverflow = "";
let previousBodyPaddingRight = "";

export const ensureModalRoot = () => {
  if (typeof document === "undefined") {
    return null;
  }
  if (modalRoot && document.body.contains(modalRoot)) {
    return modalRoot;
  }
  const existing = document.getElementById(MODAL_ROOT_ID);
  if (existing) {
    modalRoot = existing;
    return modalRoot;
  }
  modalRoot = document.createElement("div");
  modalRoot.setAttribute("id", MODAL_ROOT_ID);
  document.body.appendChild(modalRoot);
  return modalRoot;
};

export const lockBodyScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (modalInstances === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }
  modalInstances += 1;
};

export const unlockBodyScroll = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  modalInstances = Math.max(0, modalInstances - 1);
  if (modalInstances === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
  }
};
