const hasInlinePayload = (payload) =>
  typeof payload === "string" && Boolean(payload.trim());

const renderInlineVariant = ({ className, iconName, inline }) => (
  <span
    aria-hidden="true"
    className={className}
    data-icon-name={iconName}
    data-render-mode="inline"
    dangerouslySetInnerHTML={{ __html: inline }}
    draggable={false}
  />
);

const renderImageVariant = ({ className, iconName, src }) => (
  <img
    alt=""
    aria-hidden="true"
    className={className}
    data-icon-name={iconName}
    data-render-mode="image"
    draggable={false}
    src={src}
  />
);

export default function renderStaticIcon({ className, iconName, src, inline }) {
  if (hasInlinePayload(inline)) {
    return renderInlineVariant({ className, iconName, inline });
  }
  if (src) {
    return renderImageVariant({ className, iconName, src });
  }
  return null;
}
