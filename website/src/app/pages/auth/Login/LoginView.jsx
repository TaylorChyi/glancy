import PropTypes from "prop-types";
import { AuthForm } from "@shared/components";

function LoginView({ formProps }) {
  return <AuthForm {...formProps} />;
}

LoginView.propTypes = {
  formProps: PropTypes.shape({}).isRequired,
};

export default LoginView;
