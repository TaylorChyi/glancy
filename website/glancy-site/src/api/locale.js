import { API_PATHS } from '@/config/api.js'
import { apiRequest } from './client.js'
import { useApi } from '@/hooks'

export function createLocaleApi(request = apiRequest) {
  const getLocale = () => request(API_PATHS.locale)
  return { getLocale }
}

export const { getLocale } = createLocaleApi()

export function useLocaleApi() {
  return useApi().locale
}
