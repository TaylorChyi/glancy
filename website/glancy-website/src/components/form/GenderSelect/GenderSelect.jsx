import React from 'react'
import { useLanguage } from '@/context'
import styles from './GenderSelect.module.css'

const OPTIONS = ['male', 'female', 'none']

function GenderSelect({ value = '', onChange }) {
  const { t } = useLanguage()
  return (
    <div className={styles.group}>
      {OPTIONS.map((opt) => (
        <label key={opt} className={styles.option}>
          <input
            type="radio"
            value={opt}
            checked={value === opt}
            onChange={() => onChange && onChange(opt)}
          />
          <span>{t[`gender${opt.charAt(0).toUpperCase() + opt.slice(1)}`]}</span>
        </label>
      ))}
    </div>
  )
}

export default GenderSelect
