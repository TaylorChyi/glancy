import { useState, useEffect } from 'react'
import styles from './Toolbar.module.css'
import { useLanguage } from '@/context'
import { useOutsideToggle } from '@/hooks'
import { useModelStore } from '@/store'
import { useApi } from '@/hooks'

function ModelSelector() {
  const { open, setOpen, ref: menuRef } = useOutsideToggle(false)
  const { model, setModel } = useModelStore()
  const [models, setModels] = useState([])
  const { t } = useLanguage()
  const api = useApi()

  useEffect(() => {
    api.llm
      .fetchModels()
      .then((list) => setModels(list))
      .catch((err) => console.error(err))
  }, [api])

  const selectModel = (value) => {
    setModel(value)
    setOpen(false)
  }

  return (
    <div className={`${styles['toolbar-section']} ${styles['model-selector']}`} ref={menuRef}>
      <button
        type="button"
        className={styles['model-btn']}
        onClick={() => setOpen(!open)}
      >
        {t[model] || model} ▾
      </button>
      {open && (
        <div className={styles['model-menu']}>
          {models.map((m) => (
            <button key={m} type="button" onClick={() => selectModel(m)}>
              {t[m] || m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ModelSelector
