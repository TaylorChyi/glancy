import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components";
import { API_PATHS } from "@/config/api.js";
import { useUser } from "@/context";
import { useApi } from "@/hooks/useApi.js";
import { useLanguage } from "@/context";
import { validateAccount } from "@/utils/validators.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { hydrateClientSessionState } from "@/session/sessionLifecycle.js";
import { useCookieConsentStore } from "@/store";

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
