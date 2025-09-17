import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components";
import { API_PATHS } from "@/config/api.js";
import { useApi } from "@/hooks";
import { useUser } from "@/context";
import { useLanguage } from "@/context";
import { validateAccount } from "@/utils/validators.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";
import { useCookieConsentStore } from "@/store";

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
    />
  );
}

export default Register;
