import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcssImport from 'postcss-import'

// centralised directory references
const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const assetsDir = fileURLToPath(new URL('./src/assets', import.meta.url))

// alias map reused by both Vite and PostCSS
const aliases = {
  '@': srcDir,
  '@assets': assetsDir
}

export default defineConfig({
  base: './',
  resolve: {
    alias: aliases
  },
  css: {
    postcss: {
      plugins: [
        postcssImport({
          resolve(id) {
            for (const [key, target] of Object.entries(aliases)) {
              if (id.startsWith(`${key}/`)) {
                return path.resolve(target, id.slice(key.length + 1))
              }
            }
            return undefined
          }
        })
      ]
    }
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
