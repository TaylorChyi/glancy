/**
 * 背景：
 *  - AccountSection 中的字段渲染逻辑混杂类型判断与 JSX，降低可读性并阻碍拆分。
 * 目的：
 *  - 提供职责单一的字段列表组件，根据字段类型委派到对应的行组件。
 * 关键决策与取舍：
 *  - 通过简单分支选择策略组件，后续若字段类型增多，可演进为映射表或策略模式；
 *  - 保持同步渲染顺序，以匹配原有视觉布局。
 * 影响范围：
 *  - 偏好设置账号分区的字段行生成逻辑。
 * 演进与TODO：
 *  - 若后续引入虚拟化，可在此替换为惰性渲染容器。
 */
import PropTypes from "prop-types";

import {
  ACCOUNT_STATIC_FIELD_TYPE,
  ACCOUNT_USERNAME_FIELD_TYPE,
} from "./accountSection.constants.js";
import DetailActionButton from "./DetailActionButton.jsx";
import StaticFieldRow from "./StaticFieldRow.jsx";
import UsernameFieldRow from "./UsernameFieldRow.jsx";
import styles from "../Preferences.module.css";

function renderGenericField(field, labelId, valueId) {
  const renderValue = field.renderValue;

  return (
    <div key={field.id} className={styles["detail-row"]}>
      <dt id={labelId} className={styles["detail-label"]}>
        {field.label}
      </dt>
      <dd className={styles["detail-value"]} id={valueId}>
        {typeof renderValue === "function" ? renderValue(field) : field.value}
      </dd>
      <div className={styles["detail-action"]}>
        {field.action ? (
          <DetailActionButton
            label={field.action.label}
            pendingLabel={field.action.pendingLabel}
            disabled={field.action.disabled}
            isPending={field.action.isPending}
            onClick={field.action.onClick}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * 意图：遍历字段配置并按类型渲染对应的 detail 行。
 * 输入：fields —— 字段配置数组；headingId —— 组合 label/value id 的前缀。
 * 输出：返回 detail 行数组。
 * 流程：
 *  1) 生成 label/value id；
 *  2) 根据 type 选择用户名/静态/通用行组件；
 *  3) 默认回退到通用渲染。
 * 错误处理：纯展示逻辑无额外错误分支。
 * 复杂度：O(n)。
 */
function AccountFieldList({ fields, headingId }) {
  return fields.map((field) => {
    const labelId = `${headingId}-${field.id}-label`;
    const valueId = `${headingId}-${field.id}-value`;

    if (field.type === ACCOUNT_USERNAME_FIELD_TYPE) {
      return (
        <UsernameFieldRow
          key={field.id}
          field={field}
          labelId={labelId}
          valueId={valueId}
        />
      );
    }

    if (field.type === ACCOUNT_STATIC_FIELD_TYPE) {
      return (
        <StaticFieldRow
          key={field.id}
          field={field}
          labelId={labelId}
          valueId={valueId}
        />
      );
    }

    return renderGenericField(field, labelId, valueId);
  });
}

AccountFieldList.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.string,
      renderValue: PropTypes.func,
      type: PropTypes.string,
      action: PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        onClick: PropTypes.func,
        isPending: PropTypes.bool,
        pendingLabel: PropTypes.string,
      }),
    }),
  ).isRequired,
  headingId: PropTypes.string.isRequired,
};

export default AccountFieldList;
