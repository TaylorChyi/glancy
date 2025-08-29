export function cacheBust(url) {
  if (!url) return url;
  if (url.includes("_v=")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_v=${Date.now()}`;
}
