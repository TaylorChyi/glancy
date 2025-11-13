import DictionaryExperienceShellView from "./DictionaryExperienceShellView.jsx";
import { useDictionaryExperienceShellModel } from "./useDictionaryExperienceShellModel.ts";

function DictionaryExperienceShell(props) {
  const { viewProps } = useDictionaryExperienceShellModel(props);
  return <DictionaryExperienceShellView {...viewProps} />;
}

export default DictionaryExperienceShell;
