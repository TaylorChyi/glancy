import { RedeemFormPropType } from "../propTypes.js";
import styles from "../../../Preferences.module.css";

const SubscriptionRedeemForm = ({ redeemForm }) => (
  <div className={styles["subscription-actions"]}>
    <div className={styles["subscription-redeem"]}>
      <h4 className={styles["subscription-redeem-title"]}>{redeemForm.title}</h4>
      <div className={styles["subscription-redeem-form"]}>
        <input
          ref={redeemForm.inputRef}
          type="text"
          className={styles["subscription-redeem-input"]}
          placeholder={redeemForm.placeholder}
          value={redeemForm.value}
          onChange={redeemForm.onChange}
        />
        <button
          type="button"
          className={styles["subscription-redeem-button"]}
          onClick={redeemForm.onRedeem}
        >
          {redeemForm.buttonLabel}
        </button>
      </div>
    </div>
  </div>
);

SubscriptionRedeemForm.propTypes = {
  redeemForm: RedeemFormPropType.isRequired,
};

export default SubscriptionRedeemForm;
