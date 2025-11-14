import { useCallback, useEffect, useState } from "react";

import useOutsideToggle from "./useOutsideToggle.js";

export const COUNTRY_CODE_CATALOG = Object.freeze([
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
]);

export const CODE_LIST = [...COUNTRY_CODE_CATALOG].sort((a, b) =>
  a.code[1].localeCompare(b.code[1]),
);

export const DEFAULT_CODE = COUNTRY_CODE_CATALOG[0].code;

const CODE_LIST_BY_LENGTH_DESC = [...CODE_LIST].sort(
  (a, b) => b.code.length - a.code.length,
);

export const parsePhoneValue = (rawValue, fallbackCode = DEFAULT_CODE) => {
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

export const usePhoneValueState = (value, fallbackCode = DEFAULT_CODE) => {
  const [{ code, number }, setState] = useState(() =>
    parsePhoneValue(value, fallbackCode),
  );

  useEffect(() => {
    setState(parsePhoneValue(value, fallbackCode));
  }, [value, fallbackCode]);

  const setCode = useCallback((nextCode) => {
    setState((prev) => ({ ...prev, code: nextCode }));
  }, []);

  const setNumber = useCallback((nextNumber) => {
    setState((prev) => ({ ...prev, number: nextNumber }));
  }, []);

  return { code, number, setCode, setNumber };
};

const usePhoneChangeEmitter = (onChange) =>
  useCallback(
    (nextCode, nextNumber) => {
      if (onChange) {
        onChange(`${nextCode}${nextNumber}`);
      }
    },
    [onChange],
  );

export const usePhoneValueHandlers = ({
  code,
  number,
  setCode,
  setNumber,
  emitChange,
}) => {
  const selectCode = useCallback(
    (nextCode) => {
      setCode(nextCode);
      emitChange(nextCode, number);
    },
    [emitChange, number, setCode],
  );

  const handleNumberChange = useCallback(
    (event) => {
      const nextNumber = event.target.value;
      setNumber(nextNumber);
      emitChange(code, nextNumber);
    },
    [code, emitChange, setNumber],
  );

  return { selectCode, handleNumberChange };
};

export const usePhoneValue = (value, onChange, fallbackCode = DEFAULT_CODE) => {
  const { code, number, setCode, setNumber } = usePhoneValueState(
    value,
    fallbackCode,
  );

  const emitChange = usePhoneChangeEmitter(onChange);
  const { selectCode, handleNumberChange } = usePhoneValueHandlers({
    code,
    number,
    setCode,
    setNumber,
    emitChange,
  });

  return { code, number, selectCode, handleNumberChange };
};

export const usePhoneDropdown = (initialOpen = false) => {
  const { open, setOpen, ref } = useOutsideToggle(initialOpen);

  const toggle = useCallback(() => {
    setOpen((openState) => !openState);
  }, [setOpen]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  return { open, toggle, close, ref };
};
