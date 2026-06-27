import { ref } from 'vue'
import en from '../locales/en'
import ptBR from '../locales/pt-BR'
import { getItem, setItem } from '../lib/safeStorage'

const LOCALES = { en, 'pt-BR': ptBR }
const locale = ref(getItem('locale') || 'pt-BR')

export function useI18n() {
  function t(key) {
    const keys = key.split('.')
    let val = LOCALES[locale.value]
    for (const k of keys) {
      val = val?.[k]
    }
    return val ?? key
  }

  function setLocale(l) {
    locale.value = l
    setItem('locale', l)
  }

  function dateLocale() {
    return locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  }

  return { locale, t, setLocale, dateLocale }
}
