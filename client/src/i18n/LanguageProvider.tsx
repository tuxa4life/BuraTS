import { useCallback, useState } from 'react'
import type { Lang, TranslationKey } from './translations'
import { translations } from './translations'
import { LanguageContext } from './useLanguage'
import { loadStoredLang, saveStoredLang } from '../utils/storage'

// First-visit default: honour a previously saved choice, otherwise guess from
// the browser ("ka-GE" → Georgian) and fall back to English. The guess is not
// persisted — only an explicit toggle is — so detection can improve later.
const initialLang = (): Lang => {
    const stored = loadStoredLang()
    if (stored) return stored
    return navigator.language?.toLowerCase().startsWith('ka') ? 'ka' : 'en'
}

// Replaces {placeholders} in a template with values from params. Unmatched
// placeholders are left untouched so a missing param is visible, not silent.
const interpolate = (template: string, params?: Record<string, string | number>): string => {
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match))
}

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLangState] = useState<Lang>(initialLang)

    const setLang = useCallback((next: Lang) => {
        saveStoredLang(next)
        setLangState(next)
    }, [])

    const t = useCallback(
        (key: TranslationKey, params?: Record<string, string | number>) => interpolate(translations[lang][key], params),
        [lang],
    )

    return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}
