import { useId, useMemo } from "react";

const isMeaningful = (value) => typeof value === "string" && value.trim().length > 0;

export const useResponseStyleSectionDescription = ({ message, descriptionId }) => {
  const fallbackDescriptionId = useId();

  return useMemo(() => {
    if (!isMeaningful(message)) {
      return { description: undefined, descriptionId: undefined };
    }
    return {
      description: message,
      descriptionId: descriptionId ?? fallbackDescriptionId,
    };
  }, [descriptionId, fallbackDescriptionId, message]);
};

export default useResponseStyleSectionDescription;
