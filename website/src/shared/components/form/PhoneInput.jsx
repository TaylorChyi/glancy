import styles from "./PhoneInput.module.css";
import {
  CODE_LIST,
  usePhoneDropdown,
  usePhoneValue,
} from "@shared/hooks/usePhoneInput.js";

function PhoneInput({ value = "", onChange, placeholder = "" }) {
  const { code, number, selectCode, handleNumberChange } = usePhoneValue(
    value,
    onChange,
  );
  const { open, toggle, close, ref } = usePhoneDropdown();

  const handleSelect = (nextCode) => {
    selectCode(nextCode);
    close();
  };

  return (
    <div className={styles["phone-input"]} ref={ref}>
      <div className={styles["phone-code"]} onClick={toggle}>
        {code}
      </div>
      {open && (
        <div className={styles["code-options"]}>
          {CODE_LIST.map((c) => (
            <div key={c.code} onClick={() => handleSelect(c.code)}>
              {c.code}
            </div>
          ))}
        </div>
      )}
      <input
        className={styles["phone-number"]}
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export default PhoneInput;
