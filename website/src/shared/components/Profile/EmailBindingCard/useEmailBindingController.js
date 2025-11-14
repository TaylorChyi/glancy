import createEmailBindingViewModel from "./createEmailBindingViewModel.js";
import mapEmailBindingToViewModel from "./mapEmailBindingToViewModel.js";
import useEmailBindingPreparation from "./useEmailBindingPreparation.js";

export default function useEmailBindingController(props) {
  const preparation = useEmailBindingPreparation(props);
  const viewModelParams = mapEmailBindingToViewModel(props, preparation);
  return createEmailBindingViewModel(viewModelParams);
}
