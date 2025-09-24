import FormRow from "./FormRow.jsx";
import styles from "./Form.module.css";

function SelectField({
  label,
  id,
  value,
  onChange,
  options = [],
  className = "",
  ...props
}) {
  const cls = [styles.select, className].filter(Boolean).join(" ");
  const handleChange = (e) => {
    onChange && onChange(e.target.value);
  };
  const selectEl = (
    <select
      id={id}
      className={cls}
      value={value}
      onChange={handleChange}
      {...props}
    >
      {options.map((opt) => {
        const option =
          typeof opt === "string" ? { value: opt, label: opt } : opt;
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );

  return label ? (
    <FormRow label={label} id={id}>
      {selectEl}
    </FormRow>
  ) : (
    selectEl
  );
}

export default SelectField;
