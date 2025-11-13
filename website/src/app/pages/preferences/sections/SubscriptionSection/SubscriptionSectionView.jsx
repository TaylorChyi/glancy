import PropTypes from "prop-types";
import SettingsSection from "@shared/components/settings/SettingsSection";

import SubscriptionPlanCarousel from "./components/SubscriptionPlanCarousel.jsx";
import FeatureMatrixTable from "./components/FeatureMatrixTable.jsx";
import SubscriptionRedeemForm from "./components/SubscriptionRedeemForm.jsx";
import {
  FeatureMatrixPropType,
  FootnotesPropType,
  PlanRailPropType,
  RedeemFormPropType,
} from "./propTypes.js";
import styles from "../../Preferences.module.css";

const SubscriptionFootnotes = ({ footnotes }) => (
  <div className={styles["subscription-footnotes"]}>
    <p>{footnotes.pricingNote}</p>
    <p>{footnotes.taxNote}</p>
  </div>
);

function SubscriptionSectionView({
  section,
  planRail,
  featureMatrix,
  footnotes,
  redeemForm,
}) {
  return (
    <SettingsSection
      headingId={section.headingId}
      title={section.title}
      describedBy={section.descriptionId}
      classes={{
        section: `${styles.section} ${styles["section-plain"]} ${styles["subscription-section"]}`,
        header: styles["section-header"],
        title: styles["section-title"],
        divider: styles["section-divider"],
      }}
    >
      <div className={styles["subscription-matrix"]}>
        <SubscriptionPlanCarousel planRail={planRail} />
        <FeatureMatrixTable featureMatrix={featureMatrix} />
      </div>
      <SubscriptionFootnotes footnotes={footnotes} />
      <SubscriptionRedeemForm redeemForm={redeemForm} />
    </SettingsSection>
  );
}

SubscriptionFootnotes.propTypes = {
  footnotes: FootnotesPropType.isRequired,
};

SubscriptionSectionView.propTypes = {
  section: PropTypes.shape({
    headingId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    descriptionId: PropTypes.string,
  }).isRequired,
  planRail: PlanRailPropType.isRequired,
  featureMatrix: FeatureMatrixPropType.isRequired,
  footnotes: FootnotesPropType.isRequired,
  redeemForm: RedeemFormPropType.isRequired,
};

export default SubscriptionSectionView;
