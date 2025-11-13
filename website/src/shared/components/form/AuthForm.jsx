import AuthFormView from "./parts/AuthFormView.jsx";
import { useAuthFormPresentation } from "./hooks/useAuthFormPresentation.js";
const AuthForm = (props) => <AuthFormView {...props} />;

const AuthFormContainer = (props) => {
  const viewProps = useAuthFormPresentation(props);

  return <AuthForm {...viewProps} />;
};

export { AuthForm };
export default AuthFormContainer;
