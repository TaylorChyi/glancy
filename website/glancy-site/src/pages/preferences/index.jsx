import { useState, useEffect } from 'react'
import '@/pages/App/App.css'
import styles from './Preferences.module.css'
import { useLanguage } from '@/context'
import { useTheme } from '@/context'
import { useUser } from '@/context'
import { API_PATHS } from '@/config/api.js'
import MessagePopup from '@/components/ui/MessagePopup'
import { useApi } from '@/hooks'
import { useModelStore } from '@/store'

function Preferences() {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const api = useApi()
  const { model, setModel } = useModelStore()
  const [models, setModels] = useState([])
  const [sourceLang, setSourceLang] = useState(
    localStorage.getItem('sourceLang') || 'auto'
  )
  const [targetLang, setTargetLang] = useState(
    localStorage.getItem('targetLang') || 'ENGLISH'
  )
  const [defaultModel, setDefaultModel] = useState(model)
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMsg, setPopupMsg] = useState('')

  useEffect(() => {
    api.llm
      .fetchModels()
      .then((list) => setModels(list))
      .catch((err) => console.error(err))
  }, [api])

  useEffect(() => {
    if (!user) return
    api.request(`${API_PATHS.preferences}/user/${user.id}`)
      .then((data) => {
        const sl = data.systemLanguage || 'auto'
        const tl = data.searchLanguage || 'ENGLISH'
        const dm = data.dictionaryModel || model
        setSourceLang(sl)
        setTargetLang(tl)
        setDefaultModel(dm)
        setModel(dm)
        localStorage.setItem('sourceLang', sl)
        localStorage.setItem('targetLang', tl)
        setTheme(data.theme || 'system')
      })
      .catch((err) => {
        console.error(err)
        setPopupMsg(t.fail)
        setPopupOpen(true)
      })
  }, [setTheme, t, user, api, model, setModel])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return
    await api.jsonRequest(`${API_PATHS.preferences}/user/${user.id}`, {
      method: 'POST',
      body: {
        systemLanguage: sourceLang,
        searchLanguage: targetLang,
        dictionaryModel: defaultModel,
        theme
      }
    })
    localStorage.setItem('sourceLang', sourceLang)
    localStorage.setItem('targetLang', targetLang)
    setModel(defaultModel)
    setPopupMsg(t.saveSuccess)
    setPopupOpen(true)
  }

  return (
    <div className="app">
      <h2>{t.prefTitle}</h2>
      <form className={styles['preferences-form']} onSubmit={handleSave}>
        <div>
          <label htmlFor="source-lang">{t.prefLanguage}</label>
          <select
            id="source-lang"
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            <option value="auto">{t.autoDetect}</option>
            <option value="CHINESE">CHINESE</option>
            <option value="ENGLISH">ENGLISH</option>
          </select>
        </div>
        <div>
          <label htmlFor="target-lang">{t.prefSearchLanguage}</label>
          <select
            id="target-lang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            <option value="CHINESE">CHINESE</option>
            <option value="ENGLISH">ENGLISH</option>
          </select>
        </div>
        <div>
          <label htmlFor="dictionary-model">{t.prefDictionaryModel}</label>
          <select
            id="dictionary-model"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {t[m] || m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="theme-select">{t.prefTheme}</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="system">system</option>
          </select>
        </div>
        <button type="submit">{t.saveButton}</button>
      </form>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  )
}

export default Preferences
