import { setupPreferencesTestEnvironment } from "./moduleMocks.js";
import {
  preferencesLanguageFixture,
  preferencesTestState,
  resetPreferencesTestState,
} from "./state.js";

setupPreferencesTestEnvironment();
resetPreferencesTestState();

export {
  preferencesLanguageFixture,
  preferencesTestState,
  resetPreferencesTestState,
};
