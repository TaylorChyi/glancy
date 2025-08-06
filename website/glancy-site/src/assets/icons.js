/**
 * Icon registry generated via `import.meta.glob`.
 * Aggregates all SVG assets within the assets directory.
 */

const modules = import.meta.glob('./**/*.svg', {
  eager: true,
  import: 'default',
})

const icons = {}

for (const [path, mod] of Object.entries(modules)) {
  const filename = path.split('/').pop().replace('.svg', '')

  if (filename.endsWith('-light')) {
    const name = filename.replace('-light', '')
    icons[name] = { ...(icons[name] || {}), light: mod }
  } else if (filename.endsWith('-dark')) {
    const name = filename.replace('-dark', '')
    icons[name] = { ...(icons[name] || {}), dark: mod }
  } else {
    icons[filename] = { ...(icons[filename] || {}), single: mod }
  }
}

export default icons
