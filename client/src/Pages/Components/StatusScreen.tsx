import { useEffect, useState } from 'react'
import '../../styles/status.css'

type StatusScreenProps = {
    title: string
    message: string
    loading?: boolean
    action?: { label: string, onClick: () => void }
}

// Full-screen status card (connecting / joining / not found / server down),
// styled to match the lobby/pause-overlay design language. With `loading` the
// card fan bobs to signal activity; `action` renders a single ghost button.
const StatusScreen = ({ title, message, loading = false, action }: StatusScreenProps) => (
    <div className="status-container">
        <div className="status-circle top" />
        <div className="status-circle bottom" />

        <div className="status-card">
            <div className={`status-fan ${loading ? 'loading' : ''}`}>
                <img src="/cards/back_light.png" alt="" />
                <img src="/cards/back_light.png" alt="" />
                <img src="/cards/back_light.png" alt="" />
            </div>

            <h2 className="status-title">{title}</h2>
            <p className="status-message">{message}</p>

            {action && (
                <button className="status-button" onClick={action.onClick}>
                    {action.label}
                </button>
            )}
        </div>
    </div>
)

// Renders `loading` until `timeoutMs` elapses, then `fallback` instead. State
// lives here so simply unmounting it (e.g. once connected / once game data
// arrives) resets the timer for the next time the gate appears.
export const TimedFallback = ({ timeoutMs, loading, fallback }: { timeoutMs: number, loading: React.ReactNode, fallback: React.ReactNode }) => {
    const [timedOut, setTimedOut] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), timeoutMs)
        return () => clearTimeout(timer)
    }, [timeoutMs])

    return <>{timedOut ? fallback : loading}</>
}

export default StatusScreen
