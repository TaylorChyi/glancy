import { useDictionaryExperience } from "./hooks/useDictionaryExperience";
import DictionaryExperienceShell from "./components/DictionaryExperienceShell.jsx";
import "@app/pages/App/App.css";

export default function DictionaryExperience() {
  const viewModel = useDictionaryExperience();
  return <DictionaryExperienceShell {...viewModel} />;
}
