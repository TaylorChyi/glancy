import { useMemo } from "react";

import createBreakInjector from "../utils/createBreakInjector.js";

export default function useBreakableContent() {
  return useMemo(() => createBreakInjector(), []);
}
