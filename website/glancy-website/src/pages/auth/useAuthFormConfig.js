import { useLanguage } from '@/context'

export function useAuthFormConfig({ includeUsername = false } = {}) {
  const { t } = useLanguage()

  const placeholders = {
    phone: t.phonePlaceholder,
    email: t.emailPlaceholder,
    ...(includeUsername && { username: t.usernamePlaceholder })
  }

  const formMethods = includeUsername
    ? ['phone', 'email', 'username']
    : ['phone', 'email']

  const methodOrder = includeUsername
    ? ['username', 'email', 'phone', 'wechat', 'apple', 'google']
    : ['phone', 'email', 'wechat', 'apple', 'google']

  return { placeholders, formMethods, methodOrder }
}

