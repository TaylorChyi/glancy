import { useCallback, useState } from "react";

export interface UsePasswordVisibilityOptions {
  defaultVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export interface UsePasswordVisibilityResult {
  visible: boolean;
  inputType: "text" | "password";
  toggleVisibility: () => void;
}

export const usePasswordVisibility = ({
  defaultVisible = false,
  onVisibilityChange,
}: UsePasswordVisibilityOptions = {}): UsePasswordVisibilityResult => {
  const [visible, setVisible] = useState(defaultVisible);

  const toggleVisibility = useCallback(() => {
    setVisible((previousVisible) => {
      const nextVisible = !previousVisible;
      onVisibilityChange?.(nextVisible);
      return nextVisible;
    });
  }, [onVisibilityChange]);

  return {
    visible,
    inputType: visible ? "text" : "password",
    toggleVisibility,
  };
};

export default usePasswordVisibility;
