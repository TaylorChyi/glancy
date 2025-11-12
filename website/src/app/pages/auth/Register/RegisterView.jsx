import PropTypes from "prop-types";
import { AuthForm } from "@shared/components";

function RegisterView({ formProps }) {
  return <AuthForm {...formProps} />;
}

RegisterView.propTypes = {
  formProps: PropTypes.shape({}).isRequired,
};

export default RegisterView;
