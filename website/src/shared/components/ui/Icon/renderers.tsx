import type { IconRenderer } from "./Icon.types";
import {
  computeInlineStyle,
  computeFallbackStyle,
  resolveFallback,
  inlineClassName,
  bitmapClassName,
  fallbackClassName,
} from "./iconHelpers";

const composeRenderers =
  (...renderers: IconRenderer[]) =>
  (context: Parameters<IconRenderer>[0]) => {
    for (const renderer of renderers) {
      const result = renderer(context);
      if (result) {
        return result;
      }
    }
    return null;
  };

const renderInlineIcon: IconRenderer = ({
  inline,
  iconRole,
  className,
  style,
  width,
  height,
  decorative,
  altText,
  title,
}) => {
  if (!inline) {
    return null;
  }
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : altText}
      className={inlineClassName(iconRole, className)}
      style={computeInlineStyle(style, width, height)}
      aria-hidden={decorative || undefined}
      title={title}
      dangerouslySetInnerHTML={{ __html: inline }}
    />
  );
};

const renderBitmapIcon: IconRenderer = ({
  url,
  iconRole,
  className,
  style,
  width,
  height,
  decorative,
  altText,
  title,
}) => {
  if (!url) {
    return null;
  }
  return (
    <img
      src={url}
      alt={altText}
      className={bitmapClassName(iconRole, className)}
      width={width}
      height={height}
      style={style}
      aria-hidden={decorative || undefined}
      title={title}
      loading="lazy"
    />
  );
};

const renderFallbackIcon: IconRenderer = ({
  name,
  iconRole,
  className,
  style,
  width,
  height,
  decorative,
  altText,
  title,
}) => {
  const fallback = resolveFallback(name);
  return (
    <span
      role="img"
      aria-label={altText}
      className={fallbackClassName(iconRole, className)}
      data-variant={fallback.variant}
      style={computeFallbackStyle(style, width, height)}
      aria-hidden={decorative || undefined}
      title={title}
    >
      {fallback.label}
    </span>
  );
};

export const renderIcon = composeRenderers(
  renderInlineIcon,
  renderBitmapIcon,
  renderFallbackIcon,
);
