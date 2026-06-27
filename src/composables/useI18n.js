import { ref } from 'vue'
import en from '../locales/en'
import ptBR from '../locales/pt-BR'
import { translateStatus, translateCategory } from '../lib/i18nLabels'
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

  // Translate a DB/constant value (status string, category name) for display,
  // falling back to the raw value when there's no translation.
  function tStatus(value) {
    return translateStatus(LOCALES[locale.value], value)
  }

  function tCategory(value) {
    return translateCategory(LOCALES[locale.value], value)
  }

  function setLocale(l) {
    locale.value = l
    setItem('locale', l)
  }

  function dateLocale() {
    return locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  }

  return { locale, t, tStatus, tCategory, setLocale, dateLocale }
}
