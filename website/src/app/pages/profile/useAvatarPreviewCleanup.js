import { useEffect } from "react";

const useAvatarPreviewCleanup = (source) => {
  useEffect(() => {
    if (!source) {
      return undefined;
    }
    return () => {
      URL.revokeObjectURL(source);
    };
  }, [source]);
};

export default useAvatarPreviewCleanup;
export { useAvatarPreviewCleanup };
