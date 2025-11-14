import PropTypes from "prop-types";

import styles from "../../../Preferences.module.css";
import { FootnotesPropType } from "../propTypes.js";

const SubscriptionFootnotes = ({ footnotes }) => (
  <div className={styles["subscription-footnotes"]}>
    <p>{footnotes.pricingNote}</p>
    <p>{footnotes.taxNote}</p>
  </div>
);

SubscriptionFootnotes.propTypes = {
  footnotes: FootnotesPropType.isRequired,
};

export default SubscriptionFootnotes;
