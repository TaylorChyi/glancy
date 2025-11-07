import PropTypes from "prop-types";

function TriadIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      focusable="false"
      data-icon-name="language-triad"
    >
      <circle cx="12" cy="6" r="2.5" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
    </svg>
  );
}

TriadIcon.propTypes = {
  className: PropTypes.string,
};

TriadIcon.defaultProps = {
  className: undefined,
};

export default TriadIcon;
