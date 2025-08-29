import { useState, useEffect, useRef } from 'react'
import { useLocale } from '@/context'
import styles from './PhoneInput.module.css'

const CODE_LIST = [
  { country: 'CN', code: '+86' },
  { country: 'US', code: '+1' },
  { country: 'GB', code: '+44' },
  { country: 'DE', code: '+49' },
  { country: 'FR', code: '+33' },
  { country: 'RU', code: '+7' },
  { country: 'JP', code: '+81' },
  { country: 'ES', code: '+34' },
  { country: 'IN', code: '+91' },
  { country: 'AU', code: '+61' }
].sort((a, b) => a.code[1].localeCompare(b.code[1]))

function PhoneInput({ onChange, placeholder = 'Phone number' }) {
  const [code, setCode] = useState('+1')
  const [number, setNumber] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { locale } = useLocale()

  useEffect(() => {
    if (!locale) return
    const found = CODE_LIST.find((c) => c.country === locale.country)
    if (found) setCode(found.code)
  }, [locale])

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const select = (c) => {
    setCode(c)
    setOpen(false)
    if (onChange) onChange(c + number)
  }

  const handleNumber = (e) => {
    setNumber(e.target.value)
    if (onChange) onChange(code + e.target.value)
  }

  return (
    <div className={styles['phone-input']} ref={ref}>
      <div className={styles['phone-code']} onClick={() => setOpen((o) => !o)}>{code}</div>
      {open && (
        <div className={styles['code-options']}>
          {CODE_LIST.map((c) => (
            <div key={c.code} onClick={() => select(c.code)}>
              {c.code}
            </div>
          ))}
        </div>
      )}
      <input
        className={styles['phone-number']}
        value={number}
        onChange={handleNumber}
        placeholder={placeholder}
      />
    </div>
  )
}

export default PhoneInput
