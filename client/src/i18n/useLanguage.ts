import { createContext, useContext } from 'react'
import type { Lang, TranslationKey } from './translations'

export interface LanguageContextInterface {
    lang: Lang
    setLang(lang: Lang): void
    // Translate a key, optionally interpolating {placeholders} from params.
    t(key: TranslationKey, params?: Record<string, string | number>): string
}

export const LanguageContext = createContext<LanguageContextInterface | null>(null)

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) throw new Error('useLanguage must be used inside provider')

    return context
}
