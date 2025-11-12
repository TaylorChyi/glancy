import RegisterView from "./RegisterView.jsx";
import { useAuthFormController } from "../hooks/useAuthFormController.js";

function Register() {
  const { formProps } = useAuthFormController({ mode: "register" });
  return <RegisterView formProps={formProps} />;
}

export default Register;
