export const API_BASE = "/api";

export const API_PATHS = {
  words: `${API_BASE}/words`,
  users: `${API_BASE}/users`,
  login: `${API_BASE}/users/login`,
  loginWithEmail: `${API_BASE}/users/login/email`,
  register: `${API_BASE}/users/register`,
  ping: `${API_BASE}/ping`,
  locale: `${API_BASE}/locale`,
  notifications: `${API_BASE}/notifications`,
  profiles: `${API_BASE}/profiles`,
  preferences: `${API_BASE}/preferences`,
  keyboardShortcuts: `${API_BASE}/preferences/shortcuts`,
  contact: `${API_BASE}/contact`,
  searchRecords: `${API_BASE}/search-records`,
  wordReports: `${API_BASE}/word-reports`,
  redemptionCodes: `${API_BASE}/redemption-codes`,
  emailVerificationCode: `${API_BASE}/users/email/verification-code`,
  ttsWord: `${API_BASE}/tts/word`,
  ttsSentence: `${API_BASE}/tts/sentence`,
  ttsVoices: `${API_BASE}/tts/voices`,
};
