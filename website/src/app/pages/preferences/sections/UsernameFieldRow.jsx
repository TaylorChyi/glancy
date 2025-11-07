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
function UsernameFieldRow({ field, labelId, valueId }) {
  const [actionDescriptor, setActionDescriptor] = useState(null);

  const handleResolveAction = useCallback((descriptor) => {
    if (!descriptor) {
      setActionDescriptor(null);
      return;
    }

    setActionDescriptor((current) => {
      if (
        current &&
        current.label === descriptor.label &&
        current.disabled === descriptor.disabled &&
        current.mode === descriptor.mode &&
        current.onClick === descriptor.onClick
      ) {
        return current;
      }
      return descriptor;
    });
  }, []);

  const mergedInputClassName = [
    field.usernameEditorProps?.inputClassName,
    DETAIL_INPUT_CLASSNAME,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles["detail-row"]}>
      <dt id={labelId} className={styles["detail-label"]}>
        {field.label}
      </dt>
      <dd className={styles["detail-value"]} id={valueId}>
        <UsernameEditor
          {...field.usernameEditorProps}
          inputClassName={mergedInputClassName}
          renderInlineAction={false}
          onResolveAction={handleResolveAction}
        />
      </dd>
      <div className={styles["detail-action"]}>
        {actionDescriptor ? (
          <DetailActionButton
            label={actionDescriptor.label}
            disabled={Boolean(actionDescriptor.disabled)}
            onClick={actionDescriptor.onClick}
          />
        ) : null}
      </div>
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
