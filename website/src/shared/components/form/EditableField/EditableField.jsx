import useEditableField from "@shared/hooks/useEditableField.js";
import styles from "./EditableField.module.css";

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

  const containerCls = [styles.field, className].filter(Boolean).join(" ");
  const inputCls = [styles.input, inputClassName].filter(Boolean).join(" ");
  const btnCls = [styles["edit-btn"], buttonClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerCls}>
      <input
        className={inputCls}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={!editing}
      />
      {!editing && (
        <button type="button" className={btnCls} onClick={enableEdit}>
          {buttonText}
        </button>
      )}
    </div>
  );
}

export default EditableField;
