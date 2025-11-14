import FormRow from "./FormRow.jsx";
import styles from "./Form.module.css";

const normalizeOption = (option) =>
  typeof option === "string" ? { value: option, label: option } : option;

const buildSelectConfig = ({
  className = "",
  options = [],
  onChange,
  ...selectProps
}) => {
  const normalizedOptions = options.map(normalizeOption);
  const cls = [styles.select, className].filter(Boolean).join(" ");
  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  return {
    selectProps: {
      ...selectProps,
      className: cls,
      onChange: handleChange,
    },
    options: normalizedOptions,
  };
};

function SelectField({
  label,
  id,
  value,
  onChange,
  options = [],
  className = "",
  ...props
}) {
  const { selectProps, options: normalizedOptions } =
    buildSelectConfig({ id, value, onChange, options, className, ...props });
  const selectEl = (
    <select {...selectProps}>
      {normalizedOptions.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
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
