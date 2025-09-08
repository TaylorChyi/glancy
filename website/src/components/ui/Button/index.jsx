import PropTypes from "prop-types";
import styles from "./Button.module.css";

const join = (...classes) => classes.filter(Boolean).join(" ");

function Button({
  children,
  variant = "primary",
  radius = "md",
  shadow = true,
  isVisible = true,
  className = "",
  ...props
}) {
  if (!isVisible) return null;
  const btnClass = join(
    styles.button,
    styles[variant],
    styles[`radius-${radius}`],
    shadow && styles.shadow,
    className,
  );
  return (
    <button className={btnClass} {...props}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "ghost"]),
  radius: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  shadow: PropTypes.bool,
  isVisible: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
