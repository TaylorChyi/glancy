import { useNavigate } from 'react-router-dom'
import { AuthForm } from '@/components'
import { API_PATHS } from '@/config/api.js'
import { useApi } from '@/hooks'
import { useUser } from '@/context'
import { useLanguage } from '@/context'
import { useAuthFormConfig } from '../useAuthFormConfig.js'

function Register() {
  const api = useApi()
  const { setUser } = useUser()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const validateAccount = (account, method) => {
    if (method === 'email') {
      return /.+@.+\..+/.test(account)
    }
    if (method === 'phone') {
      return /^\+?\d{6,15}$/.test(account)
    }
    return true
  }

  const handleRegister = async ({ account, password, method }) => {
    await api.jsonRequest(API_PATHS.register, {
      method: 'POST',
      body: {
        [method]: account,
        code: password
      }
    })
    const loginData = await api.jsonRequest(API_PATHS.login, {
      method: 'POST',
      body: { account, method, password }
    })
    setUser(loginData)
    navigate('/')
  }

  const { placeholders, formMethods, methodOrder } = useAuthFormConfig()

  return (
    <AuthForm
      title={t.registerCreate}
      switchText={t.registerSwitch}
      switchLink="/login"
      onSubmit={handleRegister}
      placeholders={placeholders}
      formMethods={formMethods}
      methodOrder={methodOrder}
      passwordPlaceholder={() => t.codePlaceholder}
      showCodeButton={() => true}
      validateAccount={validateAccount}
    />
  )
}

export default Register
