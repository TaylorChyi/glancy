import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "@core/config/api.js";
import { useUser, useLanguage } from "@core/context";
import { hydrateClientSessionState } from "@core/session/sessionLifecycle.js";
import { useCookieConsentStore } from "@core/store";
import { useApi } from "@shared/hooks/useApi.js";
import { validateAccount } from "@shared/utils/validators.js";
import { createAuthSubmissionProtocol } from "@shared/form/authProtocols.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { getAuthViewCopy } from "./viewCopyConfig.js";

const DEFAULT_ERROR_MESSAGE = "Not implemented yet";

const useAuthViewCopy = (mode, t) =>
  useMemo(() => getAuthViewCopy(mode, t), [mode, t]);

const useUnsupportedMessage = (t) =>
  useMemo(
    () =>
      t.codeRequestInvalidMethod ||
      t.notImplementedYet ||
      DEFAULT_ERROR_MESSAGE,
    [t],
  );

const useCompleteSession = ({ setUser, recordLoginCookie, navigate }) =>
  useCallback(
    async (data) => {
      setUser(data);
      recordLoginCookie();
      await hydrateClientSessionState(data);
      navigate("/");
    },
    [navigate, recordLoginCookie, setUser],
  );

const useAuthSubmissionHandlers = ({
  mode,
  authProtocol,
  unsupportedMessage,
  viewCopy,
  completeSession,
}) => ({
  handleSubmit: useCallback(
    async ({ account, password, method }) => {
      if (mode === "register") {
        await authProtocol.register({ method, account, password });
      }
      const data = await authProtocol.login({
        method,
        account,
        password,
        unsupportedMessage,
      });
      await completeSession(data);
    },
    [authProtocol, completeSession, mode, unsupportedMessage],
  ),
  handleRequestCode: useCallback(
    async ({ account, method }) => {
      await authProtocol.requestCode({
        method,
        account,
        purpose: viewCopy.codePurpose,
        unsupportedMessage,
      });
    },
    [authProtocol, unsupportedMessage, viewCopy.codePurpose],
  ),
});

const useAuthProtocol = () => {
  const api = useApi();
  return useMemo(
    () => createAuthSubmissionProtocol({ api, paths: API_PATHS }),
    [api],
  );
};

const useLoginCookieRecorder = () =>
  useCookieConsentStore((state) => state.recordLoginCookie);

const buildFormProps = ({ viewCopy, formConfig, handleSubmit, handleRequestCode }) => ({
  title: viewCopy.title,
  switchText: viewCopy.switchText,
  switchLink: viewCopy.switchLink,
  onSubmit: handleSubmit,
  placeholders: formConfig.placeholders,
  formMethods: formConfig.formMethods,
  methodOrder: formConfig.methodOrder,
  defaultMethod: formConfig.defaultMethod,
  passwordPlaceholder: viewCopy.passwordPlaceholder,
  showCodeButton: viewCopy.showCodeButton,
  validateAccount,
  otherOptionsLabel: viewCopy.otherOptionsLabel,
  onRequestCode: handleRequestCode,
});

export function useAuthFormController({ mode }) {
  const { t } = useLanguage();
  const viewCopy = useAuthViewCopy(mode, t);
  const unsupportedMessage = useUnsupportedMessage(t);
  const authProtocol = useAuthProtocol();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const recordLoginCookie = useLoginCookieRecorder();
  const completeSession = useCompleteSession({
    setUser,
    recordLoginCookie,
    navigate,
  });
  const formConfig = useAuthFormConfig({
    includeUsername: viewCopy.includeUsername,
  });
  const { handleSubmit, handleRequestCode } = useAuthSubmissionHandlers({
    mode,
    authProtocol,
    unsupportedMessage,
    viewCopy,
    completeSession,
  });

  return {
    formProps: buildFormProps({
      viewCopy,
      formConfig,
      handleSubmit,
      handleRequestCode,
    }),
  };
}
