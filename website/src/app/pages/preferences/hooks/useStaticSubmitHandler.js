import { useCallback } from "react";

export const useStaticSubmitHandler = () =>
  useCallback((event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
  }, []);
