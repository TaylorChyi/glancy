import useEditableField from "@shared/hooks/useEditableField.js";
import styles from "./EditableField.module.css";

const combineClasses = (base, extra) =>
  [styles[base], extra].filter(Boolean).join(" ");

function EditableField({
  value,
  onChange,
  placeholder = "",
  disabled = true,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  buttonText = "Edit",
}) {
  const { editing, enableEdit } = useEditableField(disabled);
  const containerCls = combineClasses("field", className);
  const inputCls = combineClasses("input", inputClassName);
  const btnCls = combineClasses("edit-btn", buttonClassName);
  return (
    <div className={containerCls}>
      <input className={inputCls} value={value} onChange={onChange} placeholder={placeholder} disabled={!editing} />
      {!editing && (
        <button type="button" className={btnCls} onClick={enableEdit}>{buttonText}</button>
      )}
    </div>
  );
}

export default EditableField;
