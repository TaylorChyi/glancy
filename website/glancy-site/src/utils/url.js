const PRESIGNED_QUERY_KEYS = ['Signature', 'OSSAccessKeyId']

export function isPresignedUrl(url) {
  if (!url) return false
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const params = new URL(url, base).searchParams
    return PRESIGNED_QUERY_KEYS.some((key) => params.has(key))
  } catch {
    return PRESIGNED_QUERY_KEYS.some((key) =>
      new RegExp(`[?&]${key}=`).test(url)
    )
  }
}

export function cacheBust(url) {
  if (!url) return url
  if (url.includes('_v=')) return url
  if (isPresignedUrl(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_v=${Date.now()}`
}
