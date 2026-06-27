import { LANGUAGES } from './translations'
import { useLanguage } from './useLanguage'
import './languageToggle.css'

// Segmented EN / ქარ pill that behaves as a single switch: the active language
// is highlighted, and clicking anywhere on it flips to the other one (the
// segments themselves are just visual, not individually clickable). Positioning
// is left to the parent (pass `lang-toggle--floating` to fix it to the corner).
const LanguageToggle = ({ className = '' }: { className?: string }) => {
    const { lang, setLang } = useLanguage()

    const next = LANGUAGES.find((l) => l.code !== lang) ?? LANGUAGES[0]

    return (
        <button
            type="button"
            className={`lang-toggle ${className}`}
            onClick={() => setLang(next.code)}
            aria-label={`Switch language to ${next.label}`}
            title={`Switch language to ${next.label}`}
        >
            {LANGUAGES.map(({ code, label }) => (
                <span key={code} className={`lang-option ${lang === code ? 'active' : ''}`}>
                    {label}
                </span>
            ))}
        </button>
    )
}

export default LanguageToggle
