import { useEffect, useRef } from "react";

const useSyncedRef = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

export default useSyncedRef;
export { useSyncedRef };
