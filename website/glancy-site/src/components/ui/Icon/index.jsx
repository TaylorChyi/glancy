import React from 'react'
import { useTheme } from '@/context'
import ICONS from '@/assets/icons.js'

// ICONS shape: { [name]: { light?: url, dark?: url, single?: url } }

export function ThemeIcon({ name, alt, ...props }) {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const src = ICONS[name]?.[theme] || ICONS[name]?.single
  if (!src) return null
  return <img src={src} alt={alt || name} {...props} />
}

export const EllipsisVerticalIcon = (props) => (
  <ThemeIcon name="ellipsis-vertical" alt="ellipsis" {...props} />
)
export const StarSolidIcon = (props) => (
  <ThemeIcon name="star-solid" alt="star" {...props} />
)
export const TrashIcon = (props) => (
  <ThemeIcon name="trash" alt="trash" {...props} />
)

export default ThemeIcon
