export const formatSectionLabel = (label, locale) => {
  if (typeof label !== "string") {
    return label;
  }
  if (locale !== "en") {
    return label;
  }
  return label
    .split(/(\s+)/)
    .map((segment) => {
      if (!segment.trim()) {
        return segment;
      }
      const characters = Array.from(segment);
      const [first, ...rest] = characters;
      if (!first) {
        return segment;
      }
      return (
        first.toLocaleUpperCase("en-US") +
        rest.join("").toLocaleLowerCase("en-US")
      );
    })
    .join("");
};
