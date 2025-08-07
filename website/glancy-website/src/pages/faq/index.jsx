import { useEffect, useState } from 'react'
import '@/pages/App/App.css'
import { useLanguage } from '@/context'
import { API_PATHS } from '@/config/api.js'
import { useApi } from '@/hooks'
import MessagePopup from '@/components/ui/MessagePopup'

function Faq() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const api = useApi()
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupMsg, setPopupMsg] = useState('')

  useEffect(() => {
    api.request(API_PATHS.faqs)
      .then((data) => setItems(data))
      .catch((err) => {
        console.error(err)
        setPopupMsg(t.fail)
        setPopupOpen(true)
      })
  }, [api, t])

  return (
    <div className="app">
      <h2>{t.faqTitle}</h2>
      <ul>
        {items.map((f) => (
          <li key={f.id}>
            <strong>{f.q}</strong>
            <p>{f.a}</p>
          </li>
        ))}
      </ul>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </div>
  )
}

export default Faq
