import { useNavigate } from "react-router-dom";
import { AuthForm } from "@shared/components";
import { API_PATHS } from "@core/config/api.js";
import { useUser } from "@core/context";
import { useApi } from "@shared/hooks/useApi.js";
import { useLanguage } from "@core/context";
import { validateAccount } from "@shared/utils/validators.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { hydrateClientSessionState } from "@core/session/sessionLifecycle.js";
import { useCookieConsentStore } from "@core/store";

function Login() {
  const { setUser } = useUser();
  const api = useApi();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const recordLoginCookie = useCookieConsentStore(
    (state) => state.recordLoginCookie,
  );

  const handleLogin = async ({ account: rawAccount, password, method }) => {
    const unsupportedMessage =
      t.codeRequestInvalidMethod ||
      t.notImplementedYet ||
      "Not implemented yet";

    const sanitizedAccount =
      typeof rawAccount === "string" ? rawAccount.trim() : rawAccount;

    const loginRequest = {
      username: () => ({
        path: API_PATHS.login,
        body: { account: sanitizedAccount, password, method },
      }),
      email: () => ({
        path: API_PATHS.loginWithEmail,
        body: {
          email: sanitizedAccount,
          code: typeof password === "string" ? password.trim() : password,
        },
      }),
    }[method];

    if (!loginRequest) {
      throw new Error(unsupportedMessage);
    }

    const { path, body } = loginRequest();

    const data = await api.jsonRequest(path, {
      method: "POST",
      body,
    });
    setUser(data);
    recordLoginCookie();
    await hydrateClientSessionState(data);
    navigate("/");
  };

  const handleRequestCode = async ({ account: rawAccount, method }) => {
    if (method !== "email") {
      throw new Error(
        t.codeRequestInvalidMethod ||
          t.notImplementedYet ||
          "Not implemented yet",
      );
    }

    const account =
      typeof rawAccount === "string" ? rawAccount.trim() : rawAccount;

    await api.jsonRequest(API_PATHS.emailVerificationCode, {
      method: "POST",
      body: { email: account, purpose: "LOGIN" },
    });
  };

  const { placeholders, formMethods, methodOrder, defaultMethod } =
    useAuthFormConfig({
      includeUsername: true,
    });

  return (
    <AuthForm
      title={t.loginWelcome}
      switchText={t.loginSwitch}
      switchLink="/register"
      onSubmit={handleLogin}
      placeholders={placeholders}
      formMethods={formMethods}
      methodOrder={methodOrder}
      defaultMethod={defaultMethod}
      passwordPlaceholder={(m) =>
        m === "username" ? t.passwordPlaceholder : t.passwordOrCodePlaceholder
      }
      showCodeButton={(m) => m !== "username"}
      validateAccount={validateAccount}
      otherOptionsLabel={t.otherLoginOptions}
      onRequestCode={handleRequestCode}
    />
  );
}

export default Login;
