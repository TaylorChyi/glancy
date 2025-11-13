import styles from "../../../Preferences.module.css";
import { FeatureMatrixPropType } from "../propTypes.js";

const FeatureMatrixHeader = ({ featureMatrix }) => (
  <thead>
    <tr>
      <th scope="col">{featureMatrix.featureColumnLabel}</th>
      {featureMatrix.visiblePlanIds.map((planId) => (
        <th key={planId} scope="col">
          {featureMatrix.planLabels[planId] ?? planId}
        </th>
      ))}
    </tr>
  </thead>
);

const FeatureMatrixBody = ({ featureMatrix }) => (
  <tbody>
    {featureMatrix.rows.map((feature) => (
      <tr key={feature.id}>
        <th scope="row">{feature.label}</th>
        {featureMatrix.visiblePlanIds.map((planId) => (
          <td
            key={planId}
            data-plan-state={
              planId === featureMatrix.currentPlanId ? "current" : undefined
            }
          >
            {feature.values[planId] ?? ""}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

const FeatureMatrixTable = ({ featureMatrix }) => (
  <div className={styles["subscription-table-wrapper"]}>
    <table className={styles["subscription-table"]}>
      <FeatureMatrixHeader featureMatrix={featureMatrix} />
      <FeatureMatrixBody featureMatrix={featureMatrix} />
    </table>
  </div>
);

FeatureMatrixHeader.propTypes = {
  featureMatrix: FeatureMatrixPropType.isRequired,
};

FeatureMatrixBody.propTypes = {
  featureMatrix: FeatureMatrixPropType.isRequired,
};

FeatureMatrixTable.propTypes = {
  featureMatrix: FeatureMatrixPropType.isRequired,
};

export default FeatureMatrixTable;
