import { createContext, useContext } from 'react'
import type { TranslationKey } from '../i18n/translations'

export interface ToastContextInterface {
    // Show a transient error toast. Takes a translation key (resolved against the
    // current language when shown) so messages are localized — Georgian included.
    showToast(key: TranslationKey, params?: Record<string, string | number>): void
}

export const ToastContext = createContext<ToastContextInterface | undefined>(undefined)

export const useToast = (): ToastContextInterface => {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within a ToastProvider')
    return context
}
