import PropTypes from "prop-types";
import styles from "./Group.module.css";

const joinClassNames = (...tokens) => tokens.filter(Boolean).join(" ");

function Group({ title, children, className, contentClassName }) {
  return (
    <section
      className={joinClassNames(styles.group, "sidebar__section", className)}
    >
      {title ? <div className={styles.title}>{title}</div> : null}
      <div className={joinClassNames(styles.content, contentClassName)}>
        {children}
      </div>
    </section>
  );
}

Group.propTypes = {
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  contentClassName: PropTypes.string,
};

Group.defaultProps = {
  title: undefined,
  className: undefined,
  contentClassName: undefined,
};

export default Group;
