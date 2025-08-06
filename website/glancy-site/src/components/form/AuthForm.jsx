import { useState } from 'react'
import { Link } from 'react-router-dom'
import CodeButton from './CodeButton.jsx'
import PhoneInput from './PhoneInput.jsx'
import Button from '@/components/ui/Button'
import styles from './AuthForm.module.css'
import MessagePopup from '@/components/ui/MessagePopup'
import ThemeIcon from '@/components/ui/Icon'
import ICP from '@/components/ui/ICP'
import { useLanguage } from '@/context'

const defaultIcons = {
  username: 'user',
  email: 'email',
  phone: 'phone',
  wechat: 'wechat',
  apple: 'apple',
  google: 'google'
}

function AuthForm({
  title,
  switchText,
  switchLink,
  onSubmit,
  placeholders = {},
  formMethods = [],
  methodOrder = [],
  validateAccount = () => true,
  passwordPlaceholder = 'Password',
  showCodeButton = () => false,
  icons = defaultIcons
}) {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState(formMethods[0])
  const [showNotice, setShowNotice] = useState(false)
  const [noticeMsg, setNoticeMsg] = useState('')
  const { t } = useLanguage()
  const handleSendCode = () => {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNoticeMsg('')
    if (!validateAccount(account, method)) {
      setNoticeMsg(t.invalidAccount || 'Invalid account')
      setShowNotice(true)
      return
    }
    try {
      await onSubmit({ account, password, method })
    } catch (err) {
      setNoticeMsg(err.message)
      setShowNotice(true)
    }
  }

  const renderForm = () => {
    if (!formMethods.includes(method)) return null
    const passHolder =
      typeof passwordPlaceholder === 'function'
        ? passwordPlaceholder(method)
        : passwordPlaceholder
    return (
      <form onSubmit={handleSubmit} className={styles['auth-form']}>
        {method === 'phone' ? (
          <PhoneInput value={account} onChange={setAccount} />
        ) : (
          <input
            className={styles['auth-input']}
            placeholder={placeholders[method]}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        )}
        <div className={styles['password-row']}>
          <input
            className={styles['auth-input']}
            type={showCodeButton(method) ? 'text' : 'password'}
            placeholder={passHolder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {showCodeButton(method) && <CodeButton onClick={handleSendCode} />}
        </div>
        <Button type="submit" className={styles['auth-primary-btn']}>
          {t.continueButton}
        </Button>
      </form>
    )
  }

  return (
    <div className={styles['auth-page']}>
      <Link to="/" className={styles['auth-close']}>
        ×
      </Link>
      <ThemeIcon name="glancy-web" className={styles['auth-logo']} />
      <div className={styles['auth-brand']}>Glancy</div>
      <h1 className={styles['auth-title']}>{title}</h1>
      {renderForm()}
      <div className={styles['auth-switch']}>
        {switchText} <Link to={switchLink}>{switchLink.includes('login') ? t.loginButton : t.registerButton}</Link>
      </div>
      <div className={styles.divider}>
        <span>{t.or}</span>
      </div>
      <div className={styles['login-options']}>
        {methodOrder
          .filter((m) => m !== method)
          .map((m) => {
            const iconName = icons[m]
            return (
              <Button
                key={m}
                type="button"
                onClick={() => {
                  if (formMethods.includes(m)) {
                    setMethod(m)
                  } else {
                    setNoticeMsg(t.notImplementedYet || 'Not implemented yet')
                    setShowNotice(true)
                  }
                }}
              >
                <ThemeIcon name={iconName} alt={m} />
              </Button>
            )
          })}
      </div>
      <div className={styles['auth-footer']}>
        <div className={styles['footer-links']}>
          <a href="#">{t.termsOfUse}</a> | <a href="#">{t.privacyPolicy}</a>
        </div>
        <ICP />
      </div>
      <MessagePopup
        open={showNotice}
        message={noticeMsg}
        onClose={() => setShowNotice(false)}
      />
    </div>
  )
}

export default AuthForm
