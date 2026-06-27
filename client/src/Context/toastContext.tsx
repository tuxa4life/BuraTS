import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import type { TranslationKey } from '../i18n/translations'
import { ToastContext } from './useToast'
import '../styles/toast.css'

// How long the toast stays fully visible before it animates out, and how long
// the slide/fade transition runs. ANIMATION_MS must match the CSS keyframes.
const VISIBLE_MS = 3000
const ANIMATION_MS = 250

type ToastState = { id: number, text: string, leaving: boolean }

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useLanguage()
    const [toast, setToast] = useState<ToastState | null>(null)

    // Keep the latest t in a ref so showToast can stay referentially stable
    // across language switches: consumers like socketContext.joinRoom depend on
    // a stable identity, and the message is resolved fresh each time it's shown.
    const tRef = useRef(t)
    useEffect(() => {
        tRef.current = t
    }, [t])

    const counter = useRef(0)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        if (removeTimer.current) clearTimeout(removeTimer.current)

        // Replace any current toast with the new one. A fresh id remounts the
        // node so the slide-in animation re-runs even if one is already showing.
        setToast({ id: ++counter.current, text: tRef.current(key, params), leaving: false })

        hideTimer.current = setTimeout(() => {
            setToast((prev) => (prev ? { ...prev, leaving: true } : null))
            removeTimer.current = setTimeout(() => setToast(null), ANIMATION_MS)
        }, VISIBLE_MS)
    }, [])

    useEffect(() => () => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        if (removeTimer.current) clearTimeout(removeTimer.current)
    }, [])

    const value = useMemo(() => ({ showToast }), [showToast])

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-viewport">
                {toast && (
                    <div key={toast.id} className={`toast${toast.leaving ? ' leaving' : ''}`} role="alert">
                        {toast.text}
                    </div>
                )}
            </div>
        </ToastContext.Provider>
    )
}
