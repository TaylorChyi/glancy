import { useCallback, useState } from "react";
import PropTypes from "prop-types";

import UsernameEditor from "@shared/components/Profile/UsernameEditor";

import DetailActionButton from "./DetailActionButton.jsx";
import { DETAIL_INPUT_CLASSNAME } from "./detailClassNames.js";
import styles from "../Preferences.module.css";

/**
 * 意图：渲染包含标签、值列与动作列的用户名编辑行，并与 UsernameEditor 的动作回调解耦。
 * 输入：field —— 用户名字段配置；labelId/valueId —— 关联可访问性的标识符。
 * 输出：返回 detail 行节点。
 * 流程：
 *  1) 监听 UsernameEditor 的 onResolveAction，缓存最近一次按钮描述；
 *  2) 合并外部与内置的输入样式；
 *  3) 根据描述渲染统一的 DetailActionButton。
 * 错误处理：UsernameEditor 内部负责表单校验与错误提示。
 * 复杂度：O(1)。
 */
const mergeInputClassNames = (inputClassName) =>
  [inputClassName, DETAIL_INPUT_CLASSNAME].filter(Boolean).join(" ");

const useUsernameActionDescriptor = () => {
  const [descriptor, setDescriptor] = useState(null);

  const handleResolveAction = useCallback((nextDescriptor) => {
    if (!nextDescriptor) {
      setDescriptor(null);
      return;
    }

    setDescriptor((current) => {
      if (
        current &&
        current.label === nextDescriptor.label &&
        current.disabled === nextDescriptor.disabled &&
        current.mode === nextDescriptor.mode &&
        current.onClick === nextDescriptor.onClick
      ) {
        return current;
      }
      return nextDescriptor;
    });
  }, []);

  return { descriptor, handleResolveAction };
};

const UsernameFieldLabel = ({ id, children }) => (
  <dt id={id} className={styles["detail-label"]}>
    {children}
  </dt>
);

UsernameFieldLabel.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const UsernameFieldValue = ({ field, valueId, onResolveAction }) => {
  const mergedInputClassName = mergeInputClassNames(
    field.usernameEditorProps?.inputClassName,
  );

  return (
    <dd className={styles["detail-value"]} id={valueId}>
      <UsernameEditor
        {...field.usernameEditorProps}
        inputClassName={mergedInputClassName}
        renderInlineAction={false}
        onResolveAction={onResolveAction}
      />
    </dd>
  );
};

UsernameFieldValue.propTypes = {
  field: PropTypes.shape({
    usernameEditorProps: PropTypes.shape({
      inputClassName: PropTypes.string,
    }).isRequired,
  }).isRequired,
  valueId: PropTypes.string.isRequired,
  onResolveAction: PropTypes.func.isRequired,
};

const UsernameFieldAction = ({ descriptor }) => (
  <div className={styles["detail-action"]}>
    {descriptor ? (
      <DetailActionButton
        label={descriptor.label}
        disabled={Boolean(descriptor.disabled)}
        onClick={descriptor.onClick}
      />
    ) : null}
  </div>
);

UsernameFieldAction.propTypes = {
  descriptor: PropTypes.shape({
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    mode: PropTypes.string,
    onClick: PropTypes.func,
  }),
};

UsernameFieldAction.defaultProps = {
  descriptor: null,
};

function UsernameFieldRow({ field, labelId, valueId }) {
  const { descriptor, handleResolveAction } = useUsernameActionDescriptor();

  return (
    <div className={styles["detail-row"]}>
      <UsernameFieldLabel id={labelId}>{field.label}</UsernameFieldLabel>
      <UsernameFieldValue
        field={field}
        valueId={valueId}
        onResolveAction={handleResolveAction}
      />
      <UsernameFieldAction descriptor={descriptor} />
    </div>
  );
}

UsernameFieldRow.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    usernameEditorProps: PropTypes.shape({
      username: PropTypes.string,
      emptyDisplayValue: PropTypes.string,
      onSubmit: PropTypes.func,
      onSuccess: PropTypes.func,
      onFailure: PropTypes.func,
      t: UsernameEditor.propTypes.t,
      inputClassName: PropTypes.string,
    }).isRequired,
  }).isRequired,
  labelId: PropTypes.string.isRequired,
  valueId: PropTypes.string.isRequired,
};

export default UsernameFieldRow;
