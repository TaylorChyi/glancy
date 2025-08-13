import { useState, useEffect, useRef } from 'react'
import MessagePopup from '@/components/ui/MessagePopup'
import { useHistory, useUser, useFavorites } from '@/context'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/context'
import DictionaryEntry from '@/components/ui/DictionaryEntry'
import { useLanguage } from '@/context'
import { useFetchWord, useSpeechInput } from '@/hooks'
import './App.css'
import ChatInput from '@/components/ui/ChatInput'
import Layout from '@/components/Layout'
import HistoryDisplay from '@/components/ui/HistoryDisplay'
import { useModelStore } from '@/store'
import ICP from '@/components/ui/ICP'
import FavoritesView from './FavoritesView.jsx'
import { useAppShortcuts } from '@/hooks'

function App() {
  const [text, setText] = useState('')
  const [entry, setEntry] = useState(null)
  const { t, lang, setLang } = useLanguage()
  const placeholder = t.searchPlaceholder
  const [loading, setLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMsg, setPopupMsg] = useState('')
  const { user } = useUser()
  const { loadHistory, addHistory, unfavoriteHistory } = useHistory()
  const { theme, setTheme } = useTheme()
  const inputRef = useRef(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [fromFavorites, setFromFavorites] = useState(false)
  const { favorites, toggleFavorite } = useFavorites()
  const navigate = useNavigate()
  const { fetchWordWithHandling } = useFetchWord()
  const { model } = useModelStore()
  const { start: startSpeech } = useSpeechInput({ onResult: setText })

  const { toggleFavoriteEntry } = useAppShortcuts({
    inputRef,
    lang,
    setLang,
    theme,
    setTheme,
    entry,
    showFavorites,
    showHistory,
    toggleFavorite
  })

  const handleToggleFavorites = () => {
    // always show favorites when invoked
    setShowFavorites(true)
    setShowHistory(false)
    setFromFavorites(false)
  }


  const handleUnfavorite = (term) => {
    unfavoriteHistory(term, user)
    toggleFavorite(term)
  }

  const handleSelectFavorite = async (term) => {
    await handleSelectHistory(term)
    setShowFavorites(false)
    setFromFavorites(true)
  }

  const handleBackFromFavorite = () => {
    setShowFavorites(true)
    setFromFavorites(false)
    setEntry(null)
  }

  const handleVoice = () => {
    const locale = lang === 'en' ? 'en-US' : 'zh-CN'
    startSpeech(locale)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!text.trim()) return
    // ensure result view is shown when searching from favorites or history
    setShowFavorites(false)
    setShowHistory(false)
    const input = text.trim()
    setText('')
    setLoading(true)
    const { data, error, language } = await fetchWordWithHandling({
      user,
      term: input,
      model
    })
    if (error) {
      setPopupMsg(error.message)
      setPopupOpen(true)
    } else {
      setEntry(data)
      addHistory(input, user, language)
    }
    setLoading(false)
  }

  const handleSelectHistory = async (term) => {
    if (!user) {
      navigate('/login')
      return
    }
    // hide favorites or history display when showing a selected entry
    setShowFavorites(false)
    setShowHistory(false)
    setLoading(true)
    const { data, error } = await fetchWordWithHandling({
      user,
      term,
      model
    })
    if (error) {
      setPopupMsg(error.message)
      setPopupOpen(true)
    } else {
      setEntry(data)
      // selecting from history should not reorder records
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHistory(user)
  }, [user, loadHistory])

  useEffect(() => {
    if (!user) {
      setEntry(null)
      setText('')
      setShowFavorites(false)
      setShowHistory(false)
      setFromFavorites(false)
    }
  }, [user])

  return (
    <>
      <Layout
        sidebarProps={{
          onToggleFavorites: handleToggleFavorites,
          onSelectHistory: handleSelectHistory
        }}
        topBarProps={{
          term: entry?.term || '',
          showBack: !showFavorites && fromFavorites,
          onBack: handleBackFromFavorite,
          favorited: favorites.includes(entry?.term),
          onToggleFavorite: toggleFavoriteEntry,
          canFavorite: !!entry && !showFavorites && !showHistory
        }}
        bottomContent={(
          <ChatInput
            inputRef={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSubmit={handleSend}
            onVoice={handleVoice}
            placeholder={t.inputPlaceholder}
          />
        )}
      >
        <div className="display">
          {showFavorites ? (
            <FavoritesView
              favorites={favorites}
              onSelect={handleSelectFavorite}
              onUnfavorite={handleUnfavorite}
              emptyMessage={t.noFavorites}
            />
          ) : showHistory ? (
            <HistoryDisplay />
          ) : loading ? (
            '...'
          ) : entry ? (
            <DictionaryEntry entry={entry} />
          ) : (
            <div className="display-content">
              <div className="display-term">{placeholder}</div>
            </div>
          )}
        </div>
      </Layout>
      <ICP />
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  )
}

export default App
