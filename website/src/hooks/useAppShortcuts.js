import { useEffect, useCallback } from 'react'
import translations from '@/i18n/index.js'

export function useAppShortcuts({
  inputRef,
  lang,
  setLang,
  theme,
  setTheme,
  entry,
  showFavorites,
  showHistory,
  toggleFavorite
}) {
  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [inputRef])

  const cycleLanguage = useCallback(() => {
    const langs = Object.keys(translations)
    const next = langs[(langs.indexOf(lang) + 1) % langs.length]
    setLang(next)
  }, [lang, setLang])

  const cycleTheme = useCallback(() => {
    const seq = { dark: 'light', light: 'system', system: 'dark' }
    setTheme(seq[theme] || 'light')
  }, [theme, setTheme])

  const toggleFavoriteEntry = useCallback(() => {
    if (entry && !showFavorites && !showHistory) {
      toggleFavorite(entry.term)
    }
  }, [entry, showFavorites, showHistory, toggleFavorite])

  const openShortcuts = useCallback(() => {
    document.dispatchEvent(new Event('open-shortcuts'))
  }, [])

  useEffect(() => {
    function handleShortcut(e) {
      const platform =
        navigator.userAgentData?.platform || navigator.platform || ''
      const mod = /Mac|iPhone|iPod|iPad/i.test(platform) ? e.metaKey : e.ctrlKey
      if (!mod || !e.shiftKey) return
      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault()
          focusInput()
          break
        case 'l':
          e.preventDefault()
          cycleLanguage()
          break
        case 'm':
          e.preventDefault()
          cycleTheme()
          break
        case 'b':
          e.preventDefault()
          toggleFavoriteEntry()
          break
        case 'k':
          e.preventDefault()
          openShortcuts()
          break
        default:
          break
      }
    }
    document.addEventListener('keydown', handleShortcut)
    return () => document.removeEventListener('keydown', handleShortcut)
  }, [
    focusInput,
    cycleLanguage,
    cycleTheme,
    toggleFavoriteEntry,
    openShortcuts
  ])

  return {
    focusInput,
    cycleLanguage,
    cycleTheme,
    toggleFavoriteEntry,
    openShortcuts
  }
}
