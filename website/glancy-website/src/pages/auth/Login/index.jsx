import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components";
import { API_PATHS } from "@/config/api.js";
import { useApi } from "@/hooks";
import { useLanguage } from "@/context";
import { useUser } from "@/context/UserContext.jsx";
import { validateAccount } from "@/utils/validators.js";
import { useAuthFormConfig } from "../useAuthFormConfig.js";

function Login() {
  const { setUser } = useUser();
  const api = useApi();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async ({ account, password, method }) => {
    const data = await api.jsonRequest(API_PATHS.login, {
      method: "POST",
      body: { account, password, method },
    });
    setUser(data);
    navigate("/");
  };

  const { placeholders, formMethods, methodOrder } = useAuthFormConfig({
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
      passwordPlaceholder={(m) =>
        m === "username" ? t.passwordPlaceholder : t.passwordOrCodePlaceholder
      }
      showCodeButton={(m) => m !== "username"}
      validateAccount={validateAccount}
    />
  );
}

export default Login;
