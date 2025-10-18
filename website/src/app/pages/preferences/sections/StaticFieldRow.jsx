/**
 * 背景：
 *  - AccountSection 既承载静态字段又包含动作按钮渲染，造成函数复杂度与重复逻辑攀升。
 * 目的：
 *  - 提供纯展示的静态字段行组件，统一处理禁用输入框与动作按钮样式。
 * 关键决策与取舍：
 *  - 输入框属性通过浅合并获得，避免在组件内硬编码类型；
 *  - 保持无状态设计，依赖 props 控制渲染。
 * 影响范围：
 *  - 偏好设置页面中邮箱、手机号等静态字段。
 * 演进与TODO：
 *  - 如需支持复制行为，可在动作列扩展二级按钮或快捷操作。
 */
import PropTypes from "prop-types";

import DetailActionButton from "./DetailActionButton.jsx";
import { DETAIL_INPUT_CLASSNAME } from "./detailClassNames.js";
import styles from "../Preferences.module.css";

/**
 * 意图：渲染 detail 布局下的只读字段行，并可选附带动作按钮。
 * 输入：field —— 字段配置；labelId/valueId —— 可访问性关联。
 * 输出：返回 detail 行节点。
 * 流程：
 *  1) 合并默认输入属性与 field.readOnlyInputProps；
 *  2) 绑定 aria-labelledby 保障读屏顺序；
 *  3) 若存在动作描述则渲染 DetailActionButton。
 * 错误处理：无副作用逻辑。
 * 复杂度：O(1)。
 */
function StaticFieldRow({ field, labelId, valueId }) {
  const inputProps = {
    type: "text",
    inputMode: undefined,
    autoComplete: "off",
    ...field.readOnlyInputProps,
  };

  return (
    <div className={styles["detail-row"]}>
      <dt id={labelId} className={styles["detail-label"]}>
        {field.label}
      </dt>
      <dd className={styles["detail-value"]} id={valueId}>
        <input
          {...inputProps}
          className={DETAIL_INPUT_CLASSNAME}
          value={field.value}
          disabled
          readOnly
          aria-readonly="true"
          aria-labelledby={labelId}
        />
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

StaticFieldRow.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    readOnlyInputProps: PropTypes.shape({
      type: PropTypes.string,
      inputMode: PropTypes.string,
      autoComplete: PropTypes.string,
      name: PropTypes.string,
      placeholder: PropTypes.string,
    }),
    action: PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      onClick: PropTypes.func,
      isPending: PropTypes.bool,
      pendingLabel: PropTypes.string,
    }),
  }).isRequired,
  labelId: PropTypes.string.isRequired,
  valueId: PropTypes.string.isRequired,
};

export default StaticFieldRow;
