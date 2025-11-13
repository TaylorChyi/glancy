import { usePreferenceApiClients } from "../usePreferenceApiClients.js";

export const usePreferenceApiResources = ({ user, setUser }) =>
  usePreferenceApiClients({ user, setUser });
