import { useNavigate } from "react-router-dom";
import { AuthForm } from "@shared/components";
import { API_PATHS } from "@core/config/api.js";
import { useApi } from "@shared/hooks/useApi.js";
import { useUser } from "@core/context";
import { useLanguage } from "@core/context";
import { validateAccount } from "@shared/utils/validators.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { useCookieConsentStore } from "@core/store";

function Register() {
  const api = useApi();
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const recordLoginCookie = useCookieConsentStore(
    (state) => state.recordLoginCookie,
  );

  const handleRegister = async ({ account, password, method }) => {
    await api.jsonRequest(API_PATHS.register, {
      method: "POST",
      body: {
        [method]: account,
        code: password,
      },
    });
    const loginData = await api.jsonRequest(API_PATHS.login, {
      method: "POST",
      body: { account, method, password },
    });
    setUser(loginData);
    recordLoginCookie();
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
      body: { email: account, purpose: "REGISTER" },
    });
  };

  const { placeholders, formMethods, methodOrder, defaultMethod } =
    useAuthFormConfig();

  return (
    <AuthForm
      title={t.registerCreate}
      switchText={t.registerSwitch}
      switchLink="/login"
      onSubmit={handleRegister}
      placeholders={placeholders}
      formMethods={formMethods}
      methodOrder={methodOrder}
      defaultMethod={defaultMethod}
      passwordPlaceholder={() => t.codePlaceholder}
      showCodeButton={() => true}
      validateAccount={validateAccount}
      otherOptionsLabel={t.otherRegisterOptions}
      onRequestCode={handleRequestCode}
    />
  );
}

export default Register;
