import { sanitizeTerm } from "./dictionaryRequestHelpers.js";

export const guardAuthenticated = ({ user, navigate }) => {
  if (user) return true;
  navigate("/login");
  return false;
};

export const resolveInputValue = (text) => sanitizeTerm(text);

export const recordHistoryIfNecessary = ({
  addHistory,
  user,
  historyCaptureEnabled,
  dictionaryFlavor,
}) =>
  (result, inputValue) => {
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

export const createDictionaryHistorySendHandler = (deps) => {
  const guard = () => guardAuthenticated(deps);
  const normalizeInput = () => resolveInputValue(deps.text);
  const recordHistory = recordHistoryIfNecessary(deps);

  return async (event) => {
    event.preventDefault();
    if (!guard()) return;

    const inputValue = normalizeInput();
    if (!inputValue) return;

    deps.setText("");
    const result = await deps.loadEntry(inputValue);
    recordHistory(result, inputValue);
  };
};

export default createDictionaryHistorySendHandler;
