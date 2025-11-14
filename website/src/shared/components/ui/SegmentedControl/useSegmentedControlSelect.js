import { useCallback } from "react";

const useSegmentedControlSelect = ({ disabled, onChange, value }) =>
  useCallback(
    (optionValue, option) => {
      if (disabled || option.disabled) {
        return;
      }

      if (Object.is(optionValue, value)) {
        return;
      }

      if (typeof onChange === "function") {
        onChange(optionValue, option);
      }
    },
    [disabled, onChange, value],
  );

export default useSegmentedControlSelect;
