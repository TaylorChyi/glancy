/**
 * 背景：
 *  - DataSection 原本内联多个表单片段，导致视图层体量巨大且重复使用样式常量。
 * 目的：
 *  - 将视图片段拆分为纯展示组件，通过显式的属性约束控制输入，便于复用与测试。
 * 关键决策与取舍：
 *  - 组件保持无状态，所有行为通过回调注入，符合“控制器/视图”分层；
 *  - 沿用现有样式 token，通过 props 注入，避免跨文件硬编码 className；
 *  - 语言选择器继续复用 LanguageMenu，确保可访问性语义一致。
 * 影响范围：
 *  - 偏好设置数据分区的 UI 组织方式；
 *  - 其他分区若需类似布局，可复用这些基础组件。
 * 演进与TODO：
 *  - TODO: 若未来需要响应 pending 状态的骨架屏，可在此扩展占位符渲染。
 */

import PropTypes from "prop-types";
import LanguageMenu from "@shared/components/ui/LanguageMenu";
import SegmentedControl from "@shared/components/ui/SegmentedControl";
import { normalizeLanguageValue } from "./dataSectionToolkit.js";

const composeClassName = (...tokens) => tokens.filter(Boolean).join(" ");

export const HistoryCaptureField = ({ fieldId, copy, control, styles }) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {copy.label}
    </legend>
    <p className={styles.description}>{copy.description}</p>
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
    />
  </fieldset>
);

HistoryCaptureField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  styles: PropTypes.object.isRequired,
};

export const RetentionField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <fieldset className={styles["control-field"]} aria-labelledby={fieldId}>
    <legend id={fieldId} className={styles["control-label"]}>
      {copy.label}
    </legend>
    <p className={styles.description}>{copy.description}</p>
    <SegmentedControl
      labelledBy={fieldId}
      options={control.options}
      value={control.value}
      onChange={control.onChange}
      disabled={isPending}
    />
  </fieldset>
);

RetentionField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        days: PropTypes.number,
      }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
  }).isRequired,
  isPending: PropTypes.bool,
  styles: PropTypes.object.isRequired,
};

RetentionField.defaultProps = {
  isPending: false,
};

export const LanguageHistoryField = ({
  fieldId,
  copy,
  control,
  isPending,
  styles,
}) => (
  <div className={styles["control-field"]}>
    <label htmlFor={fieldId} className={styles["control-label"]}>
      {copy.label}
    </label>
    <p className={styles.description}>{copy.description}</p>
    {control.options.length > 0 ? (
      <div className={styles["language-shell"]}>
        <LanguageMenu
          id={fieldId}
          options={control.options}
          value={control.value}
          onChange={control.onChange}
          ariaLabel={copy.label}
          normalizeValue={normalizeLanguageValue}
          showLabel
          fullWidth
        />
      </div>
    ) : (
      <p className={styles.description}>{copy.placeholder}</p>
    )}
    <div className={styles["subscription-current-actions"]}>
      <button
        type="button"
        className={styles["subscription-action"]}
        onClick={control.onClear}
        disabled={!control.canClear || isPending}
      >
        {copy.clearLabel}
      </button>
    </div>
  </div>
);

LanguageHistoryField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    clearLabel: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ).isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    canClear: PropTypes.bool.isRequired,
  }).isRequired,
  isPending: PropTypes.bool.isRequired,
  styles: PropTypes.object.isRequired,
};

export const DataActionsField = ({
  copy,
  control,
  isClearingAll,
  styles,
}) => (
  <div className={styles["control-field"]}>
    <span className={styles["control-label"]}>{copy.label}</span>
    <p className={styles.description}>{copy.description}</p>
    <div className={styles["subscription-current-actions"]}>
      <button
        type="button"
        className={composeClassName(
          styles["subscription-action"],
          styles["subscription-action-danger"],
        )}
        onClick={control.onClearAll}
        disabled={!control.canClearAll || isClearingAll}
      >
        {copy.clearAllLabel}
      </button>
      <button
        type="button"
        className={styles["subscription-action"]}
        onClick={control.onExport}
      >
        {copy.exportLabel}
      </button>
    </div>
  </div>
);

DataActionsField.propTypes = {
  copy: PropTypes.shape({
    label: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    clearAllLabel: PropTypes.string.isRequired,
    exportLabel: PropTypes.string.isRequired,
  }).isRequired,
  control: PropTypes.shape({
    onClearAll: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    canClearAll: PropTypes.bool.isRequired,
  }).isRequired,
  isClearingAll: PropTypes.bool.isRequired,
  styles: PropTypes.object.isRequired,
};
