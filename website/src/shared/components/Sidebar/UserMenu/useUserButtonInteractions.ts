import { useCallback } from "react";
import type { KeyboardEvent, MouseEvent } from "react";

interface UseUserButtonInteractionsOptions {
  onToggle: () => void;
}

const isActivationKey = (key: string) =>
  key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp";

export function useUserButtonInteractions({
  onToggle,
}: UseUserButtonInteractionsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!isActivationKey(event.key)) return;
      event.preventDefault();
      onToggle();
    },
    [onToggle],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onToggle();
    },
    [onToggle],
  );

  return { handleKeyDown, handleClick };
}

export default useUserButtonInteractions;
