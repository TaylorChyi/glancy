import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale } from "@/context";
import styles from "./PhoneInput.module.css";

const CODE_LIST = [
  { country: "CN", code: "+86" },
  { country: "US", code: "+1" },
  { country: "GB", code: "+44" },
  { country: "DE", code: "+49" },
  { country: "FR", code: "+33" },
  { country: "RU", code: "+7" },
  { country: "JP", code: "+81" },
  { country: "ES", code: "+34" },
  { country: "IN", code: "+91" },
  { country: "AU", code: "+61" },
].sort((a, b) => a.code[1].localeCompare(b.code[1]));

const DEFAULT_CODE = "+1";
const CODE_LIST_BY_LENGTH_DESC = [...CODE_LIST].sort(
  (a, b) => b.code.length - a.code.length,
);

const parsePhoneValue = (rawValue, fallbackCode = DEFAULT_CODE) => {
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return { code: fallbackCode, number: "" };
  }

  const matchedEntry = CODE_LIST_BY_LENGTH_DESC.find(({ code }) =>
    rawValue.startsWith(code),
  );

  if (matchedEntry) {
    return {
      code: matchedEntry.code,
      number: rawValue.slice(matchedEntry.code.length),
    };
  }

  if (rawValue.startsWith("+")) {
    const match = rawValue.match(/^\+\d+/);
    if (match) {
      return {
        code: match[0],
        number: rawValue.slice(match[0].length),
      };
    }
  }

  return { code: fallbackCode, number: rawValue };
};

function PhoneInput({ value = "", onChange, placeholder = "" }) {
  const initial = parsePhoneValue(value, DEFAULT_CODE);
  const [code, setCode] = useState(initial.code);
  const [number, setNumber] = useState(initial.number);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { locale } = useLocale();

  const emitChange = useCallback(
    (nextCode, nextNumber) => {
      if (onChange) {
        onChange(`${nextCode}${nextNumber}`);
      }
    },
    [onChange],
  );

  useEffect(() => {
    const parsed = parsePhoneValue(value, DEFAULT_CODE);
    setCode(parsed.code);
    setNumber(parsed.number);
  }, [value]);

  useEffect(() => {
    if (!locale?.country || value) {
      return;
    }
    const found = CODE_LIST.find((entry) => entry.country === locale.country);
    if (found && found.code !== code) {
      setCode(found.code);
      emitChange(found.code, number);
    }
  }, [locale, value, code, number, emitChange]);

  useEffect(() => {
    const handler = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const select = (nextCode) => {
    setCode(nextCode);
    setOpen(false);
    emitChange(nextCode, number);
  };

  const handleNumber = (event) => {
    const nextNumber = event.target.value;
    setNumber(nextNumber);
    emitChange(code, nextNumber);
  };

  return (
    <div className={styles["phone-input"]} ref={ref}>
      <div
        className={styles["phone-code"]}
        onClick={() => setOpen((openState) => !openState)}
      >
        {code}
      </div>
      {open && (
        <div className={styles["code-options"]}>
          {CODE_LIST.map((c) => (
            <div key={c.code} onClick={() => select(c.code)}>
              {c.code}
            </div>
          ))}
        </div>
      )}
      <input
        className={styles["phone-number"]}
        value={number}
        onChange={handleNumber}
        placeholder={placeholder}
      />
    </div>
  );
}

export default PhoneInput;
