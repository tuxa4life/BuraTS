import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './Pages/Login'
import { useEffect } from 'react'
import { useUser } from './Context/useUser'
import { useSockets } from './Context/useSockets'
import Home from './Pages/Home'
import './styles/vars.css'
import Lobby from './Pages/Lobby'
import Game from './Pages/Game'
import StatusScreen, { TimedFallback } from './Pages/Components/StatusScreen'
import { useLanguage } from './i18n/useLanguage'
import LanguageToggle from './i18n/LanguageToggle'

// The server is hosted on Render and cold-starts after idling, so the first
// connection can legitimately take a minute or more. Past this window we
// assume it's actually down rather than waking up.
const CONNECT_TIMEOUT_MS = 2 * 60 * 1000

const App = () => {
    const { isLoggedIn } = useUser()
    const { connected } = useSockets()
    const { t } = useLanguage()
    const navigate = useNavigate()
    const location = useLocation()

    // Real login guard: any route (including deep links opened later) bounces
    // to /login while logged out, not just the path present at first mount.
    useEffect(() => {
        if (!isLoggedIn && location.pathname !== '/login') navigate('/login')
    }, [isLoggedIn, location.pathname, navigate])

    // Connection gate: every page needs the socket, so hold the whole app
    // behind a loading screen until it's up. Unmounting the gate on connect
    // resets the timer for any later disconnect.
    // Floating language switch: on the server-loading/down screen, Login, Home,
    // and the Lobby — but not the in-game screen.
    const showLangToggle =
        location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/lobby')

    if (!connected) {
        return (
            <>
            <LanguageToggle className="lang-toggle--floating" />
            <TimedFallback
                timeoutMs={CONNECT_TIMEOUT_MS}
                loading={
                    <StatusScreen
                        loading
                        title={t('app.connecting.title')}
                        message={t('app.connecting.message')}
                    />
                }
                fallback={
                    <StatusScreen
                        title={t('app.down.title')}
                        message={t('app.down.message')}
                        action={{ label: t('app.down.action'), onClick: () => window.location.reload() }}
                    />
                }
            />
            </>
        )
    }

    return <div>
        {showLangToggle && <LanguageToggle className="lang-toggle--floating" />}
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/lobby/:roomID' element={<Lobby />} />
            <Route path='/game/:roomID' element={<Game />} />
        </Routes>
    </div>
}

export default App