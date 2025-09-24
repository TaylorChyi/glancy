import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const getMatches = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);

    mediaQueryList.addEventListener
      ? mediaQueryList.addEventListener("change", handleChange)
      : mediaQueryList.addListener(handleChange);

    setMatches(mediaQueryList.matches);

    return () => {
      mediaQueryList.removeEventListener
        ? mediaQueryList.removeEventListener("change", handleChange)
        : mediaQueryList.removeListener(handleChange);
    };
  }, [query]);

  return matches;
}
