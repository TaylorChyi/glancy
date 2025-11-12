import LoginView from "./LoginView.jsx";
import { useAuthFormController } from "../hooks/useAuthFormController.js";

function Login() {
  const { formProps } = useAuthFormController({ mode: "login" });
  return <LoginView formProps={formProps} />;
}

export default Login;
