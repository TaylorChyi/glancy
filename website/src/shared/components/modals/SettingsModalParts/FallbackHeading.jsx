import PropTypes from "prop-types";
import modalStyles from "../SettingsModal.module.css";

function FallbackHeading({ shouldRender, id, text, register }) {
  if (!shouldRender || !id || !text) {
    return null;
  }
  return (
    <h2 id={id} className={modalStyles["visually-hidden"]} ref={register}>
      {text}
    </h2>
  );
}

FallbackHeading.propTypes = {
  shouldRender: PropTypes.bool,
  id: PropTypes.string,
  text: PropTypes.string,
  register: PropTypes.func,
};

FallbackHeading.defaultProps = {
  shouldRender: false,
  id: undefined,
  text: undefined,
  register: undefined,
};

export default FallbackHeading;
