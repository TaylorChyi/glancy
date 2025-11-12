import { useProfilePageModel } from "./useProfilePageModel.js";

export function useProfileFormController({ onCancel }) {
  const model = useProfilePageModel();
  return { ...model, onCancel };
}
