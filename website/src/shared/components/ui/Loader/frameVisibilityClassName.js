export default function frameVisibilityClassName(
  baseClassName,
  visibleClassName,
  isRevealed,
) {
  if (!visibleClassName) {
    return baseClassName;
  }
  return isRevealed ? `${baseClassName} ${visibleClassName}` : baseClassName;
}
