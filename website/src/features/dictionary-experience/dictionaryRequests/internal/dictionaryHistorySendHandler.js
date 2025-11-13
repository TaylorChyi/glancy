import { sanitizeTerm } from "./dictionaryRequestHelpers.js";

export const createDictionaryHistorySendHandler = ({
  user,
  navigate,
  text,
  setText,
  loadEntry,
  historyCaptureEnabled,
  addHistory,
  dictionaryFlavor,
}) =>
  async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }

    const inputValue = sanitizeTerm(text);
    if (!inputValue) return;

    setText("");
    const result = await loadEntry(inputValue);
    if (result.status !== "success" || !historyCaptureEnabled) {
      return;
    }

    const historyTerm = result.term ?? result.queriedTerm ?? inputValue;
    addHistory(
      historyTerm,
      user,
      result.detectedLanguage,
      result.flavor ?? dictionaryFlavor,
    );
  };

export default createDictionaryHistorySendHandler;
