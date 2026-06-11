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

// The server is hosted on Render and cold-starts after idling, so the first
// connection can legitimately take a minute or more. Past this window we
// assume it's actually down rather than waking up.
const CONNECT_TIMEOUT_MS = 2 * 60 * 1000

const App = () => {
    const { isLoggedIn } = useUser()
    const { connected } = useSockets()
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
    if (!connected) {
        return (
            <TimedFallback
                timeoutMs={CONNECT_TIMEOUT_MS}
                loading={
                    <StatusScreen
                        loading
                        title="Connecting to the server…"
                        message="The server may be waking up — the first connection can take a minute or two. Hang tight."
                    />
                }
                fallback={
                    <StatusScreen
                        title="Can't reach the server"
                        message="The server appears to be down. Refresh the page to try again — if that doesn't help, come back a bit later."
                        action={{ label: 'Refresh page', onClick: () => window.location.reload() }}
                    />
                }
            />
        )
    }

    return <div>
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/lobby/:roomID' element={<Lobby />} />
            <Route path='/game/:roomID' element={<Game />} />
        </Routes>
    </div>
}

export default App